#!/usr/bin/env node
// Análisis de las tareas hechas: con qué IA se resolvieron, quién las revisó y qué costaron.
//
//   node .agents/scripts/informe.mjs              # tabla legible por consola
//   node .agents/scripts/informe.mjs --json       # los mismos datos en JSON
//   node .agents/scripts/informe.mjs --md         # markdown, para pegar donde haga falta
//
// No hay archivo de bitácora: la fuente de verdad es el estado.json de cada tarea en specs/.
// Un registro paralelo se desincroniza; este script lee lo que ya está.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { RAIZ, leerJson, parsearArgs } from './lib/config.mjs';

const DIR_SPECS = path.join(RAIZ, 'specs');

function duracion(desde, hasta) {
  if (!desde || !hasta) return null;
  const ms = Date.parse(hasta) - Date.parse(desde);
  return Number.isFinite(ms) && ms >= 0 ? ms : null;
}

/** La marca más temprana y la más tardía entre las fases, para estimar cuánto duró la tarea. */
function extremosDeFases(fases = {}) {
  const marcas = Object.values(fases)
    .map((f) => f?.ts)
    .filter(Boolean)
    .sort();
  return marcas.length >= 2 ? [marcas[0], marcas.at(-1)] : [null, null];
}

function formatearDuracion(ms) {
  if (ms == null) return '—';
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${min % 60} min`;
}

/** Los hallazgos de todas las revisiones de una tarea, contados por severidad. */
function contarHallazgos(carpeta) {
  const conteo = { critical: 0, high: 0, medium: 0, low: 0, refutados: 0 };
  for (const archivo of readdirSync(carpeta)) {
    if (/-refutacion\.md$/.test(archivo)) {
      conteo.refutados++;
      continue;
    }
    if (!/^05-revision-.*\.json$/.test(archivo)) continue;
    const rev = leerJson(path.join(carpeta, archivo));
    for (const f of rev?.findings || []) {
      if (f.severity in conteo) conteo[f.severity]++;
    }
  }
  return conteo;
}

/** Gates de la última verificación: cuántos pasos corrieron y cuántos fallaron. */
function resumirGates(carpeta) {
  const v = leerJson(path.join(carpeta, '06-verificacion.json'));
  if (!v) return null;
  let total = 0;
  let fallados = 0;
  let salteados = 0;
  for (const repo of v.repos || []) {
    for (const paso of repo.pasos || []) {
      total++;
      if (paso.salteado) salteados++;
      else if (!paso.ok) fallados++;
    }
  }
  return { total, fallados, salteados, ok: v.ok };
}

function leerTareas() {
  if (!existsSync(DIR_SPECS)) return [];
  return readdirSync(DIR_SPECS, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const carpeta = path.join(DIR_SPECS, d.name);
      const e = leerJson(path.join(carpeta, 'estado.json'));
      if (!e) return null;

      const revisiones = e.revisiones || [];
      const motores = [...new Set(revisiones.map((r) => r.motor).filter(Boolean))];
      const iteraciones = Math.max(1, e.fases?.verificar?.iteracion ?? 1);

      return {
        issue: e.issue,
        titulo: e.titulo,
        carpeta: d.name,
        fase: e.fase,
        alcance: e.alcance || [],
        rama: e.rama,
        prs: Object.values(e.pr || {}).filter(Boolean),
        implementadaPor: {
          herramienta: e.ejecucion?.herramienta ?? null,
          modelo: e.ejecucion?.modelo ?? null,
        },
        revisadaPor: motores,
        // Un motor "anfitriona" significa que revisó la misma IA que implementó.
        revisionIndependiente: motores.length > 0 && !motores.includes('anfitriona'),
        veredictos: revisiones.map((r) => r.verdict).filter(Boolean),
        hallazgos: contarHallazgos(carpeta),
        gates: resumirGates(carpeta),
        iteraciones,
        // Si no hay marca de ejecución —tareas anteriores a que se registrara— se cae a las marcas
        // de las fases, que existen desde siempre: de la primera que se cerró a la última.
        duracionMs:
          duracion(e.ejecucion?.ts, e.ejecucion?.fin) ??
          duracion(...extremosDeFases(e.fases)),
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a.issue || '').localeCompare(b.issue || '', 'es', { numeric: true }));
}

function agregados(tareas) {
  const cerradas = tareas.filter((t) => t.fase === 'cerrada');
  const porHerramienta = {};
  const porMotor = {};
  let bloqueantes = 0;
  let refutados = 0;
  let conFallback = 0;

  for (const t of tareas) {
    const h = t.implementadaPor.herramienta ?? 'no informado';
    porHerramienta[h] = (porHerramienta[h] || 0) + 1;
    for (const m of t.revisadaPor) porMotor[m] = (porMotor[m] || 0) + 1;
    bloqueantes += t.hallazgos.critical + t.hallazgos.high;
    refutados += t.hallazgos.refutados;
    if (t.revisadaPor.includes('anfitriona')) conFallback++;
  }

  return {
    total: tareas.length,
    cerradas: cerradas.length,
    abiertas: tareas.length - cerradas.length,
    porHerramienta,
    porMotor,
    hallazgosBloqueantes: bloqueantes,
    hallazgosRefutados: refutados,
    tareasConRevisionNoIndependiente: conFallback,
  };
}

function aTexto(tareas, ag) {
  const l = [];
  l.push('TAREAS');
  l.push('');
  for (const t of tareas) {
    const impl = t.implementadaPor.herramienta
      ? `${t.implementadaPor.herramienta}${t.implementadaPor.modelo ? ` (${t.implementadaPor.modelo})` : ''}`
      : 'no informado';
    const rev = t.revisadaPor.length ? t.revisadaPor.join(' → ') : 'sin revisión';
    const hb = t.hallazgos.critical + t.hallazgos.high;

    l.push(`  ${t.issue}  ${t.titulo ?? ''}`);
    l.push(`     estado        ${t.fase}   ·   alcance: ${t.alcance.join(', ')}`);
    l.push(`     implementó    ${impl}`);
    l.push(`     revisó        ${rev}${t.revisionIndependiente ? '' : '   (no independiente)'}`);
    l.push(
      `     hallazgos     ${hb} bloqueantes · ${t.hallazgos.medium} medium · ` +
        `${t.hallazgos.low} low${t.hallazgos.refutados ? ` · ${t.hallazgos.refutados} refutados` : ''}`,
    );
    if (t.gates) {
      l.push(
        `     gates         ${t.gates.total - t.gates.fallados - t.gates.salteados}/${t.gates.total} en verde` +
          `${t.gates.salteados ? ` · ${t.gates.salteados} salteados` : ''}`,
      );
    }
    l.push(`     duración      ${formatearDuracion(t.duracionMs)}`);
    if (t.prs.length) l.push(`     PR            ${t.prs.join('  ')}`);
    l.push('');
  }

  l.push('RESUMEN');
  l.push('');
  l.push(`  tareas            ${ag.total} (${ag.cerradas} cerradas, ${ag.abiertas} abiertas)`);
  l.push(`  implementadas por ${Object.entries(ag.porHerramienta).map(([k, v]) => `${k}: ${v}`).join(' · ')}`);
  l.push(`  revisadas por     ${Object.entries(ag.porMotor).map(([k, v]) => `${k}: ${v}`).join(' · ') || '—'}`);
  l.push(`  hallazgos         ${ag.hallazgosBloqueantes} bloqueantes · ${ag.hallazgosRefutados} refutados`);
  l.push(
    `  independencia     ${ag.total - ag.tareasConRevisionNoIndependiente}/${ag.total} revisadas por un motor externo`,
  );
  return l.join('\n');
}

function aMarkdown(tareas, ag) {
  const l = [];
  l.push('# Bitácora de tareas', '');
  l.push('| Tarea | Alcance | Implementó | Revisó | Bloqueantes | Duración |');
  l.push('|---|---|---|---|---|---|');
  for (const t of tareas) {
    const impl = t.implementadaPor.herramienta
      ? `${t.implementadaPor.herramienta}${t.implementadaPor.modelo ? ` (${t.implementadaPor.modelo})` : ''}`
      : '—';
    const hb = t.hallazgos.critical + t.hallazgos.high;
    l.push(
      `| ${t.issue} — ${t.titulo ?? ''} | ${t.alcance.join(', ')} | ${impl} | ` +
        `${t.revisadaPor.join(' → ') || '—'} | ${hb}${t.hallazgos.refutados ? ` (${t.hallazgos.refutados} refutados)` : ''} | ` +
        `${formatearDuracion(t.duracionMs)} |`,
    );
  }
  l.push('', '## Resumen', '');
  l.push(`- **Tareas:** ${ag.total} (${ag.cerradas} cerradas)`);
  l.push(`- **Implementadas por:** ${Object.entries(ag.porHerramienta).map(([k, v]) => `${k} (${v})`).join(', ')}`);
  l.push(`- **Revisadas por:** ${Object.entries(ag.porMotor).map(([k, v]) => `${k} (${v})`).join(', ') || '—'}`);
  l.push(`- **Hallazgos bloqueantes:** ${ag.hallazgosBloqueantes} · **refutados:** ${ag.hallazgosRefutados}`);
  l.push(
    `- **Revisión independiente:** ${ag.total - ag.tareasConRevisionNoIndependiente} de ${ag.total} tareas`,
  );
  return l.join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────

const args = parsearArgs(process.argv.slice(2));

try {
  const tareas = leerTareas();
  const ag = agregados(tareas);

  if (args.json) {
    process.stdout.write(JSON.stringify({ ok: true, tareas, resumen: ag }, null, 2) + '\n');
  } else if (args.md) {
    process.stdout.write(aMarkdown(tareas, ag) + '\n');
  } else {
    process.stdout.write(aTexto(tareas, ag) + '\n');
  }
} catch (e) {
  process.stdout.write(JSON.stringify({ ok: false, error: e.message }) + '\n');
  process.exitCode = 1;
}
