#!/usr/bin/env node
// Deja los repos al día antes de empezar una tarea.
//
//   node .agents/scripts/sincronizar.mjs                  # todos los repos
//   node .agents/scripts/sincronizar.mjs --tarea PLAN-12  # sólo los del alcance de esa tarea
//   node .agents/scripts/sincronizar.mjs --solo-revisar   # informa sin tocar nada
//
// Por qué importa: la fase de planificación explora el código del árbol de trabajo. Si otra persona
// mergeó algo y tu copia está vieja, el plan se hace sobre una foto desactualizada y nadie se entera
// hasta que aparece un conflicto o se duplica trabajo ya hecho.
//
// Qué NO hace, a propósito: no hace merge ni rebase de tu trabajo. Si estás en una rama de tarea con
// commits propios, sólo trae lo remoto y te avisa; decidir cómo integrar es tuyo.

import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { RAIZ, cargarConfig, leerJson, parsearArgs, emitir } from './lib/config.mjs';
import { correr } from './lib/proceso.mjs';

function git(dir, args) {
  const r = correr('git', args, { cwd: dir });
  return { ok: r.status === 0, salida: (r.salida || '').trim() };
}

function contar(dir, rango) {
  const r = git(dir, ['rev-list', '--count', rango]);
  return r.ok ? Number(r.salida) : null;
}

function sincronizarRepo(nombre, repo, soloRevisar) {
  const dir = path.join(RAIZ, repo.ruta);
  const base = repo.ramaBase;

  if (!existsSync(path.join(dir, '.git'))) {
    return { repo: nombre, ok: false, motivo: 'no_clonado', detalle: `./${repo.ruta} no está clonado.` };
  }

  const fetch = git(dir, ['fetch', '--prune', 'origin']);
  if (!fetch.ok) {
    return { repo: nombre, ok: false, motivo: 'fetch_fallido', detalle: fetch.salida };
  }

  const ramaActual = git(dir, ['rev-parse', '--abbrev-ref', 'HEAD']).salida;
  const sucio = git(dir, ['status', '--porcelain']).salida;
  const detras = contar(dir, `HEAD..origin/${base}`);
  const adelante = contar(dir, `origin/${base}..HEAD`);

  const comun = { repo: nombre, ramaActual, ramaBase: base, detras, adelante, limpio: sucio === '' };

  // Con cambios sin commitear no se toca nada: podrían perderse.
  if (sucio) {
    return {
      ...comun, ok: true, accion: 'ninguna', motivo: 'working_tree_sucio',
      detalle: `Tiene ${sucio.split('\n').length} archivo(s) sin commitear. Se trajo lo remoto pero no se movió nada.`,
    };
  }

  // En una rama de tarea con commits propios: se informa, no se integra. Esa decisión es humana.
  if (ramaActual !== base && adelante > 0) {
    return {
      ...comun, ok: true, accion: 'ninguna', motivo: 'rama_con_trabajo',
      detalle: `Estás en "${ramaActual}" con ${adelante} commit(s) que no están en ${base}. ` +
               `Se trajo lo remoto; integrarlo es decisión tuya.`,
    };
  }

  if (soloRevisar) {
    return { ...comun, ok: true, accion: 'ninguna', motivo: 'solo_revisar' };
  }

  // Rama de tarea ya integrada (o sin commits propios): volver a la base es el punto de partida sano.
  if (ramaActual !== base) {
    const ck = git(dir, ['checkout', base]);
    if (!ck.ok) {
      return { ...comun, ok: false, motivo: 'checkout_fallido', detalle: ck.salida };
    }
  }

  // --ff-only: si no avanza en línea recta, es que hay divergencia y hay que mirarla, no fusionarla sola.
  const antes = git(dir, ['rev-parse', '--short', 'HEAD']).salida;
  const pull = git(dir, ['pull', '--ff-only', 'origin', base]);
  if (!pull.ok) {
    return {
      ...comun, ok: false, motivo: 'pull_no_fast_forward',
      detalle: `El pull de ${base} no avanza en línea recta: hay commits locales divergentes. ` +
               `Revisalo a mano. ${pull.salida}`,
    };
  }
  const despues = git(dir, ['rev-parse', '--short', 'HEAD']).salida;

  return {
    ...comun,
    ok: true,
    ramaActual: base,
    accion: antes === despues ? 'ya_estaba_al_dia' : 'actualizado',
    commitsTraidos: antes === despues ? 0 : detras,
    de: antes,
    a: despues,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────

const args = parsearArgs(process.argv.slice(2));

try {
  const cfg = cargarConfig();

  let alcance = Object.keys(cfg.repos);
  if (args.tarea) {
    const dirSpecs = path.join(RAIZ, 'specs');
    const carpeta = existsSync(dirSpecs)
      ? readdirSync(dirSpecs).find((n) => n.toUpperCase().startsWith(`${String(args.tarea).toUpperCase()}-`))
      : null;
    // Si la tarea todavía no tiene carpeta, se sincroniza todo: es el caso normal al arrancar.
    if (carpeta) {
      const estado = leerJson(path.join(dirSpecs, carpeta, 'estado.json'));
      if (estado?.alcance?.length) alcance = estado.alcance;
    }
  }
  if (args.repo) alcance = alcance.filter((r) => r === args.repo);

  const repos = alcance.map((n) => sincronizarRepo(n, cfg.repos[n], Boolean(args['solo-revisar'])));
  const conProblema = repos.filter((r) => !r.ok);
  const requierenAtencion = repos.filter((r) => r.ok && r.motivo && r.accion === 'ninguna');

  emitir(
    {
      ok: conProblema.length === 0,
      soloRevisar: Boolean(args['solo-revisar']),
      repos,
      requierenAtencion: requierenAtencion.map((r) => `${r.repo}: ${r.detalle}`),
    },
    conProblema.length === 0 ? 0 : 1,
  );
} catch (e) {
  emitir({ ok: false, error: e.message }, 1);
}
