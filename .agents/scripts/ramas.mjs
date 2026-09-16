#!/usr/bin/env node
// Ramas de tarea: la misma rama, con el mismo nombre, en todos los repos del alcance.
//
//   node .agents/scripts/ramas.mjs estado --tarea PLAN-12
//   node .agents/scripts/ramas.mjs crear  --tarea PLAN-12
//   node .agents/scripts/ramas.mjs crear  --tarea PLAN-12 --repo backend

import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { RAIZ, cargarConfig, leerJson, parsearArgs, emitir } from './lib/config.mjs';
import { correr } from './lib/proceso.mjs';

function git(dir, args) {
  const r = correr('git', args, { cwd: dir });
  return { ok: r.status === 0, salida: r.salida.trim(), codigo: r.status };
}

function carpetaDeTarea(issue) {
  const dirSpecs = path.join(RAIZ, 'specs');
  if (!existsSync(dirSpecs)) return null;
  const clave = String(issue).toUpperCase();
  const n = readdirSync(dirSpecs).find((d) => d.toUpperCase().startsWith(`${clave}-`));
  return n ? path.join(dirSpecs, n) : null;
}

function estadoRepo(nombre, repo, ramaEsperada) {
  const dir = path.join(RAIZ, repo.ruta);
  if (!existsSync(path.join(dir, '.git'))) {
    return { repo: nombre, ok: false, motivo: 'no_clonado' };
  }
  const actual = git(dir, ['rev-parse', '--abbrev-ref', 'HEAD']).salida;
  const sucio = git(dir, ['status', '--porcelain']).salida;
  const existeRama = git(dir, ['rev-parse', '--verify', `refs/heads/${ramaEsperada}`]).ok;
  return {
    repo: nombre,
    ok: true,
    ramaActual: actual,
    ramaEsperada,
    enLaRama: actual === ramaEsperada,
    existeRama,
    limpio: sucio === '',
    archivosSucios: sucio ? sucio.split('\n').length : 0,
  };
}

function crearRama(nombre, repo, rama) {
  const dir = path.join(RAIZ, repo.ruta);
  if (!existsSync(path.join(dir, '.git'))) {
    return { repo: nombre, ok: false, motivo: 'no_clonado', detalle: `./${repo.ruta} no está clonado.` };
  }

  // Nunca ramificar sobre trabajo ajeno sin avisar: si hay cambios sin commitear, se para acá.
  const sucio = git(dir, ['status', '--porcelain']).salida;
  if (sucio) {
    return {
      repo: nombre, ok: false, motivo: 'working_tree_sucio',
      detalle: `./${repo.ruta} tiene ${sucio.split('\n').length} archivo(s) sin commitear. ` +
               `Resolvelo antes de crear la rama.`,
      archivos: sucio.split('\n').slice(0, 10),
    };
  }

  if (git(dir, ['rev-parse', '--verify', `refs/heads/${rama}`]).ok) {
    const r = git(dir, ['checkout', rama]);
    return { repo: nombre, ok: r.ok, motivo: 'ya_existia', rama, detalle: r.ok ? null : r.salida };
  }

  // La rama base sale de workspace.json, nunca del default de git: hay máquinas con
  // init.defaultBranch=master apuntando a repos cuya rama es main.
  const base = repo.ramaBase;
  git(dir, ['fetch', 'origin', base]);
  const refBase = git(dir, ['rev-parse', '--verify', `origin/${base}`]).ok ? `origin/${base}` : base;

  const r = git(dir, ['checkout', '-b', rama, refBase]);
  return {
    repo: nombre, ok: r.ok, motivo: r.ok ? 'creada' : 'error',
    rama, base: refBase, detalle: r.ok ? null : r.salida,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────

const args = parsearArgs(process.argv.slice(2));
const comando = args._[0] || 'estado';

try {
  const cfg = cargarConfig();
  if (!args.tarea) throw new Error('Falta --tarea (por ejemplo: --tarea PLAN-12)');

  const carpeta = carpetaDeTarea(args.tarea);
  if (!carpeta) throw new Error(`No encontré specs/ para ${args.tarea}. Corré estado.mjs crear primero.`);
  const estado = leerJson(path.join(carpeta, 'estado.json'));
  if (!estado?.rama) throw new Error(`El estado de ${args.tarea} no tiene rama definida.`);

  let alcance = estado.alcance || [];
  if (args.repo) alcance = alcance.filter((r) => r === args.repo);
  if (alcance.length === 0) throw new Error('No quedó ningún repo en el alcance.');

  if (comando === 'estado') {
    const repos = alcance.map((n) => estadoRepo(n, cfg.repos[n], estado.rama));
    emitir({ ok: true, tarea: estado.issue, rama: estado.rama, repos });
  } else if (comando === 'crear') {
    const repos = alcance.map((n) => crearRama(n, cfg.repos[n], estado.rama));
    const fallados = repos.filter((r) => !r.ok);
    emitir(
      { ok: fallados.length === 0, tarea: estado.issue, rama: estado.rama, repos },
      fallados.length === 0 ? 0 : 1
    );
  } else {
    throw new Error(`Comando desconocido: "${comando}". Usá: estado | crear`);
  }
} catch (e) {
  emitir({ ok: false, error: e.message }, 1);
}
