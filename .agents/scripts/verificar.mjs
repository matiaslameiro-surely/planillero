#!/usr/bin/env node
// Gates determinísticos: compilar, tests, lint, tipos. Sin criterio, sólo códigos de salida.
//
//   node .agents/scripts/verificar.mjs --tarea PLAN-12
//   node .agents/scripts/verificar.mjs --repo backend        # sin tarea, no escribe artefacto
//   node .agents/scripts/verificar.mjs --tarea PLAN-12 --repo frontend

import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import {
  RAIZ, cargarConfig, leerJson, escribirJson, parsearArgs, emitir, esWindows,
} from './lib/config.mjs';
import { correr } from './lib/proceso.mjs';

const LINEAS_DE_SALIDA = 80; // un build fallido puede escupir miles; al contexto sólo le sirve la cola

function cola(texto, n = LINEAS_DE_SALIDA) {
  const lineas = (texto || '').replace(/\r\n/g, '\n').trimEnd().split('\n');
  return lineas.length <= n
    ? lineas.join('\n')
    : `[…${lineas.length - n} líneas omitidas…]\n` + lineas.slice(-n).join('\n');
}

/** Resuelve el wrapper del proyecto según la plataforma: mvnw.cmd en Windows, ./mvnw en POSIX. */
function resolverEjecutable(dir, nombre) {
  const candidatos = esWindows
    ? [`${nombre}.cmd`, `${nombre}.bat`, nombre]
    : [nombre, `${nombre}.sh`];
  for (const c of candidatos) {
    if (existsSync(path.join(dir, c))) return path.join(dir, c);
  }
  return null; // no es un wrapper del repo: será un binario del PATH (npm, npx…)
}

function correrPaso(paso, dir, env) {
  const [primero, ...resto] = paso.cmd.split(/\s+/);
  const wrapper = resolverEjecutable(dir, primero);
  const bin = wrapper || primero;

  const inicio = Date.now();
  const r = correr(bin, resto, { cwd: dir, env, timeout: 15 * 60 * 1000 });
  const duracionMs = Date.now() - inicio;
  const salida = r.salida;

  if (r.error?.code === 'ENOENT') {
    return { ...paso, ok: false, codigo: null, duracionMs,
      salida: `No se encontró el ejecutable "${primero}" en ${path.relative(RAIZ, dir)} ni en el PATH.` };
  }
  if (r.error?.code === 'ETIMEDOUT') {
    return { ...paso, ok: false, codigo: null, duracionMs, salida: 'El paso superó los 15 minutos y se canceló.' };
  }
  return { ...paso, ok: r.status === 0, codigo: r.status, duracionMs, salida: cola(salida) };
}

/**
 * El `java` del PATH puede ser otra versión (en esta máquina es un JRE 8).
 * No alcanza con JAVA_HOME: hay que anteponer su bin al PATH, porque cualquier plugin
 * que invoque `java` por su cuenta usaría el del PATH y fallaría con un error que no
 * dice que el problema es la versión.
 */
function entornoJava(repo) {
  const javaHome = repo.env?.JAVA_HOME;
  if (!javaHome) return { env: process.env, aviso: null };
  if (!existsSync(javaHome)) {
    return { env: process.env, aviso: `JAVA_HOME apunta a "${javaHome}", que no existe.` };
  }
  const bin = path.join(javaHome, 'bin');
  return {
    env: { ...process.env, JAVA_HOME: javaHome, PATH: `${bin}${path.delimiter}${process.env.PATH}` },
    aviso: null,
  };
}

function verificarVersionJava(env, esperada) {
  // `java -version` escribe en stderr aunque salga bien: hay que mirar los dos flujos.
  const r = correr('java', ['-version'], { env });
  const m = r.salida.match(/version "(\d+)/);
  if (!m) return { ok: false, detalle: 'No se pudo determinar la versión de Java.' };
  const encontrada = Number(m[1]);
  return encontrada === esperada
    ? { ok: true, version: encontrada }
    : { ok: false, version: encontrada,
        detalle: `Java ${encontrada} en uso, pero el backend necesita ${esperada}. ` +
                 `Configurá repos.backend.env.JAVA_HOME en workspace.local.json (node .agents/scripts/init.mjs).` };
}

/** Qué conjunto de pasos corresponde, según lo que el repo realmente tenga. */
function elegirPasos(repo, dir) {
  const v = repo.verificacion || {};
  if (resolverEjecutable(dir, 'mvnw') && v.maven) return { herramienta: 'maven', pasos: v.maven };
  if (resolverEjecutable(dir, 'gradlew') && v.gradle) return { herramienta: 'gradle', pasos: v.gradle };
  if (existsSync(path.join(dir, 'package.json')) && v.npm) return { herramienta: 'npm', pasos: v.npm };
  return { herramienta: null, pasos: [] };
}

function pasoAplicable(paso, dir) {
  // `npm test` sólo tiene sentido si el script existe; si no, el paso se saltea sin ensuciar el resultado.
  if (/^npm test\b/.test(paso.cmd)) {
    const pkg = leerJson(path.join(dir, 'package.json'), null);
    if (!pkg?.scripts?.test) return { aplicable: false, motivo: 'el package.json no define el script "test"' };
  }
  if (/^npm run (\w[\w:-]*)/.test(paso.cmd)) {
    const script = paso.cmd.match(/^npm run ([\w:-]+)/)[1];
    const pkg = leerJson(path.join(dir, 'package.json'), null);
    if (!pkg?.scripts?.[script]) return { aplicable: false, motivo: `el package.json no define el script "${script}"` };
  }
  return { aplicable: true };
}

function estaVacio(dir) {
  try {
    const visibles = readdirSync(dir).filter((n) => n !== '.git' && !/^readme/i.test(n));
    return visibles.length === 0;
  } catch {
    return true;
  }
}

function verificarRepo(nombre, repo) {
  const dir = path.join(RAIZ, repo.ruta);
  if (!existsSync(path.join(dir, '.git'))) {
    return { repo: nombre, ok: false, motivo: 'no_clonado',
      detalle: `./${repo.ruta} no está clonado. Ver README.md.`, pasos: [] };
  }
  if (estaVacio(dir)) {
    return { repo: nombre, ok: true, motivo: 'sin_proyecto',
      detalle: `./${repo.ruta} todavía no tiene proyecto: no hay nada que verificar.`, pasos: [] };
  }

  let env = process.env;
  let avisos = [];
  if (repo.tipo === 'spring-boot') {
    const res = entornoJava(repo);
    env = res.env;
    if (res.aviso) avisos.push(res.aviso);
  } else if (repo.env?.PATH) {
    env = { ...process.env, PATH: `${repo.env.PATH}${path.delimiter}${process.env.PATH}` };
  }

  if (repo.tipo === 'spring-boot' && repo.javaVersion) {
    const java = verificarVersionJava(env, repo.javaVersion);
    if (!java.ok) {
      // Falla ruidosa y temprana: un problema de toolchain disfrazado de test roto cuesta horas.
      return { repo: nombre, ok: false, motivo: 'java_incorrecto', detalle: java.detalle, pasos: [], avisos };
    }
  }

  const { herramienta, pasos } = elegirPasos(repo, dir);
  if (!herramienta) {
    return { repo: nombre, ok: true, motivo: 'sin_gates',
      detalle: `No se detectó con qué construir ./${repo.ruta}.`, pasos: [], avisos };
  }

  const resultados = [];
  for (const paso of pasos) {
    const { aplicable, motivo } = pasoAplicable(paso, dir);
    if (!aplicable) {
      resultados.push({ ...paso, ok: true, salteado: true, motivo });
      continue;
    }
    const r = correrPaso(paso, dir, env);
    resultados.push(r);
    // Si falla compilar, correr los tests sólo agrega ruido: se corta acá.
    if (!r.ok && !paso.opcional) break;
  }

  const fallados = resultados.filter((r) => !r.ok && !r.opcional);
  return { repo: nombre, ok: fallados.length === 0, herramienta, pasos: resultados, avisos };
}

// ─── Main ─────────────────────────────────────────────────────────────────

const args = parsearArgs(process.argv.slice(2));

try {
  const cfg = cargarConfig();

  let alcance;
  let carpetaTarea = null;
  if (args.tarea) {
    const dirSpecs = path.join(RAIZ, 'specs');
    const carpeta = existsSync(dirSpecs)
      ? readdirSync(dirSpecs).find((n) => n.toUpperCase().startsWith(`${String(args.tarea).toUpperCase()}-`))
      : null;
    if (!carpeta) throw new Error(`No encontré specs/ para ${args.tarea}. ¿Corriste estado.mjs crear?`);
    carpetaTarea = path.join(dirSpecs, carpeta);
    const estado = leerJson(path.join(carpetaTarea, 'estado.json'));
    alcance = estado?.alcance || [];
  } else {
    alcance = Object.keys(cfg.repos);
  }
  if (args.repo) alcance = alcance.filter((r) => r === args.repo);
  if (alcance.length === 0) throw new Error('No quedó ningún repo en el alcance a verificar.');

  const repos = alcance.map((n) => verificarRepo(n, cfg.repos[n]));
  const resultado = {
    ok: repos.every((r) => r.ok),
    tarea: args.tarea || null,
    ts: new Date().toISOString(),
    repos,
  };

  if (carpetaTarea) {
    const destino = path.join(carpetaTarea, '06-verificacion.json');
    escribirJson(destino, resultado);
    resultado.archivo = path.relative(RAIZ, destino);
  }

  emitir(resultado, resultado.ok ? 0 : 1);
} catch (e) {
  emitir({ ok: false, error: e.message }, 1);
}
