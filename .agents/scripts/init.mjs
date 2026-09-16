#!/usr/bin/env node
// Valida el entorno, detecta qué herramientas hay en esta máquina y escribe workspace.local.json.
//
//   node .agents/scripts/init.mjs            # diagnostica y escribe la config local si falta
//   node .agents/scripts/init.mjs --check    # sólo diagnostica, no escribe nada
//   node .agents/scripts/init.mjs --motores codex,anfitriona   # fija tu cadena de revisión
//   node .agents/scripts/init.mjs --forzar   # reescribe workspace.local.json aunque exista

import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import {
  RAIZ, RUTA_LOCAL, cargarConfig, escribirJson, leerJson,
  parsearArgs, emitir, esWindows,
} from './lib/config.mjs';
import { resolverBin, correr as ejecutar } from './lib/proceso.mjs';

const args = parsearArgs(process.argv.slice(2));

// ─── Utilidades de detección ──────────────────────────────────────────────

const buscarEnPath = (nombre) => resolverBin(nombre);

/**
 * Corre un ejecutable y devuelve stdout+stderr juntos, o null si no se pudo ejecutar.
 * Los dos flujos importan: `java -version`, por ejemplo, escribe en stderr aunque salga bien.
 */
function correr(bin, argumentos, opciones = {}) {
  const r = ejecutar(bin, argumentos, { timeout: 15000, ...opciones });
  if (r.error) return null;
  return r.salida.trim() || null;
}

/** Ubicaciones habituales de un JDK, además de JAVA_HOME. */
function candidatosJdk() {
  const candidatos = [];
  if (process.env.JAVA_HOME) candidatos.push(process.env.JAVA_HOME);
  const bases = esWindows
    ? ['C:\\Program Files\\Eclipse Adoptium', 'C:\\Program Files\\Java',
       'C:\\Program Files\\Microsoft', 'C:\\Program Files\\Amazon Corretto']
    : ['/usr/lib/jvm', '/Library/Java/JavaVirtualMachines', '/opt/homebrew/opt'];
  for (const base of bases) {
    try {
      for (const d of readdirSync(base)) {
        const completo = path.join(base, d);
        const mac = path.join(completo, 'Contents', 'Home');
        candidatos.push(existsSync(mac) ? mac : completo);
      }
    } catch { /* la base no existe en esta máquina */ }
  }
  return candidatos;
}

function versionJava(javaHome) {
  const bin = path.join(javaHome, 'bin', esWindows ? 'java.exe' : 'java');
  if (!existsSync(bin)) return null;
  const salida = correr(bin, ['-version']);
  if (!salida) return null;
  const m = salida.match(/version "(\d+)(?:\.(\d+))?/);
  return m ? { mayor: Number(m[1]), texto: salida.split('\n')[0], home: javaHome, bin } : null;
}

/**
 * Un JDK embebido en un IDE sirve, pero es frágil: una actualización del IDE lo mueve o le
 * cambia la versión, y el build del backend se rompe con un error que no dice eso.
 * Por eso, a igualdad de versión, preferimos siempre un JDK instalado aparte.
 */
const RE_JDK_DE_IDE = /android studio|jetbrains|intellij|idea|\\jbr\b|\/jbr\b/i;

function detectarJdk(versionRequerida) {
  const vistos = new Set();
  const encontrados = [];
  for (const c of candidatosJdk()) {
    if (!c || vistos.has(c)) continue;
    vistos.add(c);
    const v = versionJava(c);
    if (v) encontrados.push({ ...v, deIde: RE_JDK_DE_IDE.test(v.home) });
  }
  const conLaVersion = encontrados.filter((v) => v.mayor === versionRequerida);
  const elegido =
    conLaVersion.find((v) => !v.deIde) || conLaVersion[0] || null;
  return { elegido, todos: encontrados };
}

/**
 * Motores de revisión conocidos. Agregar uno nuevo es sumar una entrada acá:
 * no hay lógica atada a ningún producto en el resto del harness.
 */
const MOTORES_CONOCIDOS = {
  codex: { bin: 'codex', descripcion: 'Codex CLI (OpenAI)' },
  claude: { bin: 'claude', descripcion: 'Claude Code CLI (Anthropic)' },
  gemini: { bin: 'gemini', descripcion: 'Gemini CLI (Google)' },
  cursor: { bin: 'cursor-agent', descripcion: 'Cursor Agent' },
};

function detectarMotores() {
  const disponibles = [];
  for (const [nombre, def] of Object.entries(MOTORES_CONOCIDOS)) {
    const ruta = buscarEnPath(def.bin);
    if (ruta) disponibles.push({ nombre, ruta, descripcion: def.descripcion });
  }
  return disponibles;
}

// ─── Diagnóstico ──────────────────────────────────────────────────────────

function diagnosticar(cfg) {
  const problemas = [];
  const avisos = [];

  const nodeMayor = Number(process.versions.node.split('.')[0]);
  if (nodeMayor < 20) problemas.push(`Node ${process.versions.node}: el harness necesita 20 o superior.`);

  const git = buscarEnPath('git');
  if (!git) problemas.push('No se encontró `git` en el PATH.');

  const gh = buscarEnPath('gh');
  if (!gh) avisos.push('No se encontró `gh` (GitHub CLI): no vas a poder crear los PRs desde el harness.');

  const versionJdk = cfg.repos?.backend?.javaVersion ?? 21;
  const jdk = detectarJdk(versionJdk);
  if (!jdk.elegido) {
    const lista = jdk.todos.map((v) => `${v.mayor} (${v.home})`).join(', ') || 'ninguno';
    avisos.push(
      `No se encontró un JDK ${versionJdk}. Detectados: ${lista}. ` +
      `Sin él no se puede verificar el backend.`
    );
  }

  const repos = Object.entries(cfg.repos || {}).map(([nombre, r]) => {
    const abs = path.join(RAIZ, r.ruta);
    return { nombre, ruta: r.ruta, clonado: existsSync(path.join(abs, '.git')), url: r.url || null };
  });
  for (const r of repos) {
    if (!r.clonado) {
      avisos.push(`El repo "${r.nombre}" todavía no está clonado en ./${r.ruta}.`);
    }
  }

  if (cfg.$clavesPersonalesFiltradas?.length) {
    problemas.push(
      `workspace.json (compartido) tiene claves personales: ${cfg.$clavesPersonalesFiltradas.join(', ')}. ` +
      `Movelas a workspace.local.json para no imponérselas al resto del equipo.`
    );
  }

  return {
    problemas, avisos, repos,
    node: process.versions.node,
    git: git ? correr(git, ['--version']) : null,
    gh: gh ? correr(gh, ['--version'])?.split('\n')[0] : null,
    jdk: jdk.elegido
      ? { version: jdk.elegido.mayor, home: jdk.elegido.home }
      : { version: null, detectados: jdk.todos.map((v) => ({ version: v.mayor, home: v.home })) },
    motoresDisponibles: detectarMotores(),
  };
}

// ─── Escritura de la configuración local ──────────────────────────────────

function construirLocal(dx, motoresPedidos, existente) {
  const detectados = dx.motoresDisponibles.map((m) => m.nombre);
  // "anfitriona" siempre va al final: es el motor que nunca falta.
  const motores = motoresPedidos
    ? motoresPedidos.split(',').map((s) => s.trim()).filter(Boolean)
    : [...detectados, 'anfitriona'];
  if (!motores.includes('anfitriona')) motores.push('anfitriona');

  const local = {
    $comentario: [
      'Configuración de ESTA máquina. Está en .gitignore: no se comparte ni se versiona.',
      'revision.motores es tu cadena de revisión: se prueba en orden hasta que uno responda.',
      '"anfitriona" significa que revisa la IA que ya estás usando, con contexto limpio.',
    ],
    ...(existente || {}),
    revision: { ...(existente?.revision || {}), motores },
  };

  if (dx.jdk.home) {
    local.repos = {
      ...(existente?.repos || {}),
      backend: { ...(existente?.repos?.backend || {}), env: { JAVA_HOME: dx.jdk.home } },
    };
  }
  return local;
}

// ─── Main ─────────────────────────────────────────────────────────────────

try {
  const cfg = cargarConfig();
  const dx = diagnosticar(cfg);

  let escrito = null;
  if (!args.check) {
    const yaExiste = existsSync(RUTA_LOCAL);
    if (!yaExiste || args.forzar || args.motores) {
      const existente = yaExiste ? leerJson(RUTA_LOCAL, {}) : null;
      const local = construirLocal(dx, args.motores === true ? null : args.motores, existente);
      escribirJson(RUTA_LOCAL, local);
      escrito = path.relative(RAIZ, RUTA_LOCAL);
    }
  }

  const cfgFinal = cargarConfig();
  emitir({
    ok: dx.problemas.length === 0,
    entorno: {
      node: dx.node, git: dx.git, gh: dx.gh, jdk: dx.jdk,
      plataforma: process.platform,
    },
    repos: dx.repos,
    revision: {
      motoresDisponibles: dx.motoresDisponibles,
      cadenaConfigurada: cfgFinal.revision?.motores || ['anfitriona'],
    },
    configLocal: { ruta: path.relative(RAIZ, RUTA_LOCAL), existe: cfgFinal.$hayLocal, escritaAhora: escrito },
    problemas: dx.problemas,
    avisos: dx.avisos,
  }, dx.problemas.length === 0 ? 0 : 1);
} catch (e) {
  emitir({ ok: false, error: e.message }, 1);
}
