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

// Motivos que piden una decisión humana antes de seguir: son los únicos que van a `requierenAtencion`.
// La lista es explícita a propósito: un motivo nuevo no entra ahí salvo que alguien lo decida.
const MOTIVOS_QUE_REQUIEREN_ATENCION = new Set(['working_tree_sucio', 'rama_con_trabajo', 'base_divergente']);

function git(dir, args) {
  const r = correr('git', args, { cwd: dir });
  return { ok: r.status === 0, salida: (r.salida || '').trim() };
}

// null si git falla o no devuelve un entero: `correr` junta stdout y stderr, y un warning de git
// (por ejemplo, un tag que se llama igual que la rama) haría que la cuenta no fuera un número.
function contar(dir, rango) {
  const r = git(dir, ['rev-list', '--count', rango]);
  if (!r.ok) return null;
  const n = Number(r.salida.split(/\r?\n/).pop());
  return Number.isInteger(n) ? n : null;
}

// Cómo está la rama base LOCAL respecto de origin. Es lo que decide la sincronización real, que vuelve
// a la base y hace `pull --ff-only` sobre ella, aunque ahora se esté parado en otra rama. Si la base
// local no existe, el checkout la crea desde origin y queda al día.
function estadoDeLaBaseLocal(dir, base) {
  const existe = git(dir, ['rev-parse', '--verify', '--quiet', `refs/heads/${base}`]).ok;
  if (!existe) return { detras: 0, adelante: 0 };
  return {
    detras: contar(dir, `refs/heads/${base}..refs/remotes/origin/${base}`),
    adelante: contar(dir, `refs/remotes/origin/${base}..refs/heads/${base}`),
  };
}

// Qué haría la sincronización real en un repo que --solo-revisar no marca para atención. Tiene que
// anticiparlo bien: si dice «se actualizaría», el pull --ff-only tiene que poder hacerlo. `detras` y
// `adelante` son los de la base local (ver `estadoDeLaBaseLocal`), y nunca divergentes: ese caso es
// `base_divergente`.
function detalleSoloRevisar({ ramaActual, base, detras, adelante }) {
  const partes = [];
  if (ramaActual === 'HEAD') {
    partes.push(`Con HEAD desacoplado y sin commits propios: sin --solo-revisar volvería a ${base}.`);
  } else if (ramaActual !== base) {
    partes.push(`En "${ramaActual}", sin commits propios: sin --solo-revisar volvería a ${base}.`);
  }

  if (adelante > 0) {
    partes.push(`${base} tiene ${adelante} commit(s) locales sin publicar.`);
  } else if (detras > 0) {
    partes.push(`${base} está ${detras} commit(s) detrás de origin/${base}. Sin --solo-revisar se actualizaría.`);
  } else {
    partes.push(`${base} está al día con origin/${base}.`);
  }
  return partes.join(' ');
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

  // `branch --show-current` y no `rev-parse --abbrev-ref`: éste devuelve "heads/main" si hay un tag
  // que se llama igual que la rama. Con HEAD desacoplado sale vacío, y se informa como "HEAD".
  const ramaActual = git(dir, ['branch', '--show-current']).salida || 'HEAD';
  const sucio = git(dir, ['status', '--porcelain']).salida;
  const detras = contar(dir, `HEAD..origin/${base}`);
  const adelante = contar(dir, `origin/${base}..HEAD`);

  const comun = { repo: nombre, ramaActual, ramaBase: base, detras, adelante, limpio: sucio === '' };

  // Sin poder comparar con la base remota no se puede afirmar nada sobre el repo: ni que está al día ni
  // que no tiene trabajo propio. Vale también sin --solo-revisar, a propósito: antes se intentaba el
  // checkout o el pull igual y fallaba más adelante, a veces después de cambiar de rama.
  if (detras === null || adelante === null) {
    const error = git(dir, ['rev-list', '--count', `HEAD..origin/${base}`]).salida.split('\n')[0];
    return {
      ...comun, ok: false, motivo: 'rama_base_no_disponible',
      detalle: `No se pudo comparar con origin/${base}: ${error || 'git no dio detalle'}. ` +
               `Revisá que la rama base exista en el remoto, que \`ramaBase\` esté bien en ` +
               `workspace.json y que el repo tenga al menos un commit.`,
    };
  }

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
    const baseLocal = estadoDeLaBaseLocal(dir, base);
    // Sin poder medir la base local no se afirma que esté al día.
    if (baseLocal.detras === null || baseLocal.adelante === null) {
      return {
        ...comun, ok: false, motivo: 'rama_base_no_disponible', baseLocal,
        detalle: `No se pudo comparar la rama local ${base} con origin/${base}. Revisalo a mano.`,
      };
    }
    // La base local divergió de origin: la sincronización real terminaría en `pull_no_fast_forward`.
    // Se marca para atención en vez de dejarlo escrito sólo en el detalle.
    if (baseLocal.detras > 0 && baseLocal.adelante > 0) {
      return {
        ...comun, ok: true, accion: 'ninguna', motivo: 'base_divergente', baseLocal,
        detalle: `${base} tiene ${baseLocal.adelante} commit(s) locales sin publicar y está ` +
                 `${baseLocal.detras} detrás de origin/${base}: la sincronización fallaría ` +
                 `(el pull no avanza en línea recta). Revisalo a mano.`,
      };
    }
    return {
      ...comun, ok: true, accion: 'ninguna', motivo: 'solo_revisar', baseLocal,
      detalle: detalleSoloRevisar({ ramaActual, base, ...baseLocal }),
    };
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
    // Se cuenta lo que avanzó la base, no `detras`: ese se midió desde HEAD, que puede ser otra rama.
    commitsTraidos: antes === despues ? 0 : contar(dir, `${antes}..${despues}`),
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
  const requierenAtencion = repos.filter((r) => r.ok && MOTIVOS_QUE_REQUIEREN_ATENCION.has(r.motivo));

  emitir(
    {
      ok: conProblema.length === 0,
      soloRevisar: Boolean(args['solo-revisar']),
      repos,
      requierenAtencion: requierenAtencion.map((r) => `${r.repo}: ${r.detalle ?? r.motivo}`),
    },
    conProblema.length === 0 ? 0 : 1,
  );
} catch (e) {
  emitir({ ok: false, error: e.message }, 1);
}
