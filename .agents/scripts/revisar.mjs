#!/usr/bin/env node
// Revisión independiente. Recorre la cadena de motores configurada hasta que uno responda
// algo válido. Si ninguno externo está disponible, devuelve la señal "anfitriona" para que
// la revise la IA que está corriendo, con contexto limpio.
//
//   node .agents/scripts/revisar.mjs --tarea PLAN-12 --repo backend
//   node .agents/scripts/revisar.mjs --tarea PLAN-12 --repo backend --forzar-externo
//   node .agents/scripts/revisar.mjs --guardar --tarea PLAN-12 --repo backend < revision.json
//
// SIEMPRE sale con código 0 salvo que el script mismo falle: quien lo llama ramifica por el
// campo `motor`, no por el exit code. Así una herramienta caída no se confunde con un error.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import {
  RAIZ, RUTA_CACHE, cargarConfig, leerJson, escribirJson, parsearArgs, emitir,
} from './lib/config.mjs';
import { lanzar, matarArbol } from './lib/proceso.mjs';
import { validarRevision, construirPrompt, recortarDiff, hallazgosBloqueantes } from './lib/revision.mjs';

const RUTA_ESQUEMA = path.join(RAIZ, '.agents', 'schemas', 'revision.schema.json');
const ARCHIVO_CACHE = path.join(RUTA_CACHE, 'motores.json');
const TIMEOUT_POR_DEFECTO = 5 * 60 * 1000;
const TTL_SIN_CUOTA_MIN = 60;

// ─── Clasificación de fallos de un motor externo ──────────────────────────

/** Tipos de error estructurados que emiten las CLIs cuando se agota el plan. */
const RE_TIPO_SIN_CUOTA = /usage_limit_reached|rate_limit_reached|credits_depleted|quota_exceeded/i;

/** Red de seguridad por texto, para cuando el CLI no emite un error estructurado. */
const PATRONES_SIN_CUOTA = [
  /you'?ve hit your usage limit/i,
  /usage[ _]limit[ _](reached|exceeded)/i,
  /rate[ _]limit/i,
  /too many requests/i,
  /\b429\b/,
  /credits? (are )?depleted/i,
  /quota (exceeded|exhausted)/i,
  /insufficient (quota|credits)/i,
];

const PATRONES_SIN_AUTH = [
  /not (logged in|authenticated)/i,
  /authentication (required|failed)/i,
  /\blogin\b.*\brequired\b/i,
  /run `?\w+ login`?/i,
];

// ─── Caché de motores caídos ──────────────────────────────────────────────
// Sin esto, cada revisión de cada repo reintenta 30-60 segundos algo que ya se sabe que falla.

function leerCache() {
  return leerJson(ARCHIVO_CACHE, {}) || {};
}

function motorEnPausa(motor) {
  const entrada = leerCache()[motor];
  if (!entrada?.hasta) return null;
  return Date.now() < Date.parse(entrada.hasta) ? entrada : null;
}

function pausarMotor(motor, { motivo, resetsAt, ttlMin = TTL_SIN_CUOTA_MIN }) {
  const cache = leerCache();
  const hasta = resetsAt
    ? new Date(resetsAt).toISOString()
    : new Date(Date.now() + ttlMin * 60_000).toISOString();
  cache[motor] = { motivo, desde: new Date().toISOString(), hasta, origen: resetsAt ? 'informado' : 'ttl' };
  escribirJson(ARCHIVO_CACHE, cache);
  return hasta;
}

// ─── Adaptadores de motores ───────────────────────────────────────────────
// Agregar un motor es sumar una entrada acá. Nada más del harness conoce ningún producto.

const ADAPTADORES = {
  codex: {
    bin: 'codex',
    argumentos: ({ repoDir, salida }) => [
      'exec', '--json', '--ephemeral',
      '-s', 'read-only',
      '-C', repoDir,
      '--output-schema', RUTA_ESQUEMA,
      '-o', salida,
      '-', // el prompt entra por stdin: evita los problemas de comillas de Windows
    ],
  },
};

/** Un motor definido a mano en workspace.local.json, para una CLI que el harness no conoce. */
function adaptadorPersonalizado(cfgMotor) {
  return {
    bin: cfgMotor.bin,
    argumentos: ({ repoDir, salida }) =>
      (cfgMotor.args || []).map((a) =>
        a.replace('{repo}', repoDir).replace('{salida}', salida).replace('{esquema}', RUTA_ESQUEMA)
      ),
  };
}

function parsearJsonl(texto) {
  const eventos = [];
  for (const linea of (texto || '').split(/\r?\n/)) {
    const t = linea.trim();
    if (!t.startsWith('{')) continue;
    try { eventos.push(JSON.parse(t)); } catch { /* línea parcial */ }
  }
  return eventos;
}

/** Busca una clave en cualquier nivel: resiste cambios de forma entre versiones de un CLI. */
function buscarProfundo(nodo, clave, vistos = new Set()) {
  if (!nodo || typeof nodo !== 'object' || vistos.has(nodo)) return null;
  vistos.add(nodo);
  if (clave in nodo && nodo[clave] != null) return nodo[clave];
  for (const v of Object.values(nodo)) {
    const hallado = buscarProfundo(v, clave, vistos);
    if (hallado != null) return hallado;
  }
  return null;
}

function ejecutarMotor(adaptador, { repoDir, prompt, salida, timeoutMs }) {
  return new Promise((resolve) => {
    const args = adaptador.argumentos({ repoDir, salida });
    // `lanzar` resuelve el entrecomillado de Windows: sin eso, una ruta con espacios
    // (C:\Users\Juan Perez\...) llegaría partida en varios argumentos.
    const hijo = lanzar(adaptador.bin, args, { cwd: repoDir, env: process.env });

    let stdout = '', stderr = '', porTimeout = false, errorSpawn = null;
    const reloj = setTimeout(() => { porTimeout = true; matarArbol(hijo.pid); }, timeoutMs);

    hijo.stdout.on('data', (d) => { stdout += d; });
    hijo.stderr.on('data', (d) => { stderr += d; });
    hijo.on('error', (e) => { errorSpawn = e; });
    hijo.on('close', (codigo) => {
      clearTimeout(reloj);
      resolve({ codigo, stdout, stderr, porTimeout, errorSpawn, eventos: parsearJsonl(stdout) });
    });

    hijo.stdin.on('error', () => {}); // EPIPE si el proceso muere antes de leer
    hijo.stdin.end(prompt, 'utf8');
  });
}

const recorte = (t, n = 500) => (t || '').trim().replace(/\s+/g, ' ').slice(0, n);

/**
 * Clasifica el resultado de un motor. Deliberadamente NO se confía en el exit code:
 * varias CLIs terminan en 0 con el turno fallado, y el código concreto no es estable
 * entre versiones. Se clasifica por contenido.
 */
function clasificar(r) {
  if (r.errorSpawn?.code === 'ENOENT') return { motivo: 'no_instalado', detalle: 'No está en el PATH.' };
  if (r.errorSpawn) return { motivo: 'error', detalle: r.errorSpawn.message };
  if (r.porTimeout) return { motivo: 'timeout', detalle: 'No respondió dentro del límite configurado.' };

  const fallo = r.eventos.find((e) => e.type === 'turn.failed' || e.type === 'error');
  const tipo = fallo?.error?.type ?? fallo?.error?.code ?? '';
  if (RE_TIPO_SIN_CUOTA.test(tipo)) {
    return {
      motivo: 'sin_cuota',
      resetsAt: fallo?.error?.resets_at ?? buscarProfundo(fallo, 'resets_at'),
      detalle: `El motor informó "${tipo}".`,
    };
  }

  const texto = `${r.stderr}\n${r.stdout}`;
  if (PATRONES_SIN_CUOTA.some((p) => p.test(texto))) {
    return { motivo: 'sin_cuota', resetsAt: null, detalle: recorte(texto) };
  }
  if (PATRONES_SIN_AUTH.some((p) => p.test(texto))) {
    return { motivo: 'sin_auth', detalle: 'El motor no está autenticado.' };
  }
  if (fallo || r.codigo !== 0) return { motivo: 'error', detalle: recorte(texto) };
  return null; // sin fallo detectable
}

/** Si la ventana de uso quedó al límite, la próxima corrida arranca directo en el siguiente motor. */
function revisarUsoAlto(motor, eventos) {
  const limites = buscarProfundo({ eventos }, 'rate_limits');
  if (!limites) return null;
  const pico = Math.max(limites.primary?.used_percent ?? 0, limites.secondary?.used_percent ?? 0);
  if (pico >= 95) {
    pausarMotor(motor, { motivo: 'uso_alto', resetsAt: limites.primary?.resets_at ?? null });
  }
  return pico || null;
}

// ─── Contexto de la revisión ──────────────────────────────────────────────

function git(dir, args) {
  const r = spawnSync('git', args, { cwd: dir, encoding: 'utf8', windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
  return r.status === 0 ? (r.stdout || '') : null;
}

function carpetaDeTarea(issue) {
  const dirSpecs = path.join(RAIZ, 'specs');
  if (!existsSync(dirSpecs)) return null;
  const clave = String(issue).toUpperCase();
  const n = readdirSync(dirSpecs).find((d) => d.toUpperCase().startsWith(`${clave}-`));
  return n ? path.join(dirSpecs, n) : null;
}

function siguienteArchivoRevision(carpeta, repo) {
  let n = 1;
  while (existsSync(path.join(carpeta, `05-revision-${repo}-${n}.json`))) n++;
  return path.join(carpeta, `05-revision-${repo}-${n}.json`);
}

// ─── Main ─────────────────────────────────────────────────────────────────

const args = parsearArgs(process.argv.slice(2));

async function main() {
  const cfg = cargarConfig();
  const nombreRepo = args.repo;
  if (!nombreRepo) throw new Error('Falta --repo (por ejemplo: --repo backend)');
  const repo = cfg.repos[nombreRepo];
  if (!repo) throw new Error(`El repo "${nombreRepo}" no está en workspace.json`);

  const carpeta = carpetaDeTarea(args.tarea);
  if (!carpeta) throw new Error(`No encontré specs/ para ${args.tarea}.`);
  const estado = leerJson(path.join(carpeta, 'estado.json'));
  const repoDir = path.join(RAIZ, repo.ruta);

  // Modo --guardar: recibe por stdin la revisión que hizo la IA anfitriona y la valida y archiva.
  if (args.guardar) {
    const crudo = readFileSync(0, 'utf8');
    let revision;
    try { revision = JSON.parse(crudo); }
    catch (e) { return emitir({ ok: false, error: `La revisión no es JSON válido: ${e.message}` }, 1); }
    const errores = validarRevision(revision);
    if (errores.length) {
      return emitir({ ok: false, error: 'La revisión no cumple el esquema.', errores }, 1);
    }
    const destino = siguienteArchivoRevision(carpeta, nombreRepo);
    escribirJson(destino, revision);
    return emitir({
      ok: true, motor: 'anfitriona', guardado: path.relative(RAIZ, destino),
      bloqueantes: hallazgosBloqueantes(revision, cfg.revision.severidadesQueBloquean).length,
      revision,
    });
  }

  // Contexto: el mismo para cualquier motor, así dos revisiones son comparables.
  const base = args.base || `origin/${repo.ramaBase}`;
  const rama = estado?.rama || git(repoDir, ['rev-parse', '--abbrev-ref', 'HEAD'])?.trim() || 'HEAD';
  const diffCrudo = git(repoDir, ['diff', `${base}...HEAD`]) ?? git(repoDir, ['diff', base]) ?? '';
  if (!diffCrudo.trim()) {
    return emitir({
      ok: true, motor: null, motivo: 'sin_cambios',
      detalle: `No hay diferencias entre ${base} y ${rama} en ./${repo.ruta}: no hay nada que revisar.`,
    });
  }
  const { diff, recortado } = recortarDiff(diffCrudo);
  const rutaSpec = path.join(carpeta, '01-spec.md');
  const spec = existsSync(rutaSpec) ? readFileSync(rutaSpec, 'utf8') : '(la tarea todavía no tiene spec)';
  const prompt = construirPrompt({
    repo: nombreRepo, rama, ramaBase: base, spec, diff, esquemaRuta: RUTA_ESQUEMA,
  });

  const cadena = cfg.revision?.motores || ['anfitriona'];
  const intentos = [];

  for (const motor of cadena) {
    if (motor === 'anfitriona') break; // es la señal, no un subproceso: se resuelve fuera

    const pausa = args['forzar-externo'] ? null : motorEnPausa(motor);
    if (pausa) {
      intentos.push({ motor, motivo: 'en_pausa', detalle: `Pausado por "${pausa.motivo}".`, hasta: pausa.hasta });
      continue;
    }

    const cfgMotor = cfg.revision?.config?.[motor];
    const adaptador = ADAPTADORES[motor] || (cfgMotor?.bin ? adaptadorPersonalizado(cfgMotor) : null);
    if (!adaptador) {
      intentos.push({ motor, motivo: 'desconocido',
        detalle: `No hay adaptador para "${motor}". Definí revision.config.${motor}.bin en workspace.local.json.` });
      continue;
    }

    const dirTmp = path.join(carpeta, '.tmp');
    mkdirSync(dirTmp, { recursive: true });
    const salida = path.join(dirTmp, `${motor}-${nombreRepo}.json`);
    try { rmSync(salida, { force: true }); } catch { /* no existía */ }

    const r = await ejecutarMotor(adaptador, {
      repoDir, prompt, salida, timeoutMs: cfgMotor?.timeoutMs ?? TIMEOUT_POR_DEFECTO,
    });

    const fallo = clasificar(r);
    if (fallo) {
      const hasta = fallo.motivo === 'sin_cuota'
        ? pausarMotor(motor, { motivo: fallo.motivo, resetsAt: fallo.resetsAt })
        : null;
      intentos.push({ motor, ...fallo, hasta });
      continue;
    }

    if (!existsSync(salida)) {
      intentos.push({ motor, motivo: 'sin_salida', detalle: 'Terminó bien pero no escribió el resultado.' });
      continue;
    }
    let revision;
    try { revision = JSON.parse(readFileSync(salida, 'utf8')); }
    catch (e) { intentos.push({ motor, motivo: 'salida_invalida', detalle: e.message }); continue; }

    const errores = validarRevision(revision);
    if (errores.length) {
      // Mejor mandar al próximo motor que pasarle una revisión dudosa a quien orquesta.
      intentos.push({ motor, motivo: 'salida_invalida', detalle: errores.slice(0, 3).join(' · ') });
      continue;
    }

    const usoPct = revisarUsoAlto(motor, r.eventos);
    const destino = siguienteArchivoRevision(carpeta, nombreRepo);
    escribirJson(destino, revision);
    return emitir({
      ok: true, motor, motivo: null, intentos,
      archivo: path.relative(RAIZ, destino),
      diffRecortado: recortado, usoPct,
      bloqueantes: hallazgosBloqueantes(revision, cfg.revision.severidadesQueBloquean).length,
      revision,
    });
  }

  // Ningún motor externo respondió: le toca a la IA que está corriendo.
  const primerMotivo = intentos.find((i) => i.motivo)?.motivo ?? 'sin_motores_externos';
  return emitir({
    ok: true,
    motor: 'anfitriona',
    motivo: primerMotivo,
    intentos,
    reintentarDespuesDe: intentos.map((i) => i.hasta).filter(Boolean).sort()[0] ?? null,
    instrucciones: [
      'Revisá vos con contexto limpio: leé sólo el diff y la especificación, nunca el razonamiento de quien implementó.',
      `Diff: git -C ${repo.ruta} diff ${base}...HEAD`,
      `Spec: ${path.relative(RAIZ, rutaSpec)}`,
      'Respondé únicamente con el JSON del esquema y guardalo con:',
      `  node .agents/scripts/revisar.mjs --guardar --tarea ${args.tarea} --repo ${nombreRepo} < revision.json`,
      'Contale al usuario en una línea por qué se usó el motor anfitrión.',
    ],
    esquema: path.relative(RAIZ, RUTA_ESQUEMA),
  });
}

main().catch((e) => emitir({ ok: false, error: e.message }, 1));
