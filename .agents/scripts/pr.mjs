#!/usr/bin/env node
// Crea los pull requests de una tarea y los enlaza entre sí.
//
//   node .agents/scripts/pr.mjs --tarea PLAN-12
//   node .agents/scripts/pr.mjs --tarea PLAN-12 --simular   # arma los cuerpos y no crea nada
//
// En una tarea full-stack crea dos PRs: primero el del backend, después el del frontend con
// una referencia al anterior, y al final vuelve sobre el del backend para dejar el enlace
// en los dos sentidos.

import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { RAIZ, cargarConfig, leerJson, parsearArgs, emitir } from './lib/config.mjs';
import { correr, resolverBin } from './lib/proceso.mjs';

function carpetaDeTarea(issue) {
  const dirSpecs = path.join(RAIZ, 'specs');
  if (!existsSync(dirSpecs)) return null;
  const clave = String(issue).toUpperCase();
  const n = readdirSync(dirSpecs).find((d) => d.toUpperCase().startsWith(`${clave}-`));
  return n ? path.join(dirSpecs, n) : null;
}

/** De "https://github.com/owner/repo.git" a "owner/repo". */
function repoDeUrl(url) {
  const m = String(url || '').match(/github\.com[/:]([^/]+)\/([^/.]+)/);
  return m ? `${m[1]}/${m[2]}` : null;
}

/**
 * Los criterios de aceptación de la spec, como checklist para quien revise.
 * Un criterio puede ocupar varias líneas: las de continuación se unen a la anterior, porque
 * cortarlas deja el criterio a mitad de frase y sin la parte que lo hace verificable.
 */
function criteriosDeSpec(spec) {
  const seccion = spec.split(/^##\s+Criterios de aceptación\s*$/mi)[1];
  if (!seccion) return [];

  const criterios = [];
  for (const linea of seccion.split(/^##\s/m)[0].split('\n')) {
    const texto = linea.trim();
    if (/^\d+\.\s+\S/.test(texto)) {
      criterios.push(texto.replace(/^\d+\.\s+/, ''));
    } else if (texto && criterios.length > 0) {
      criterios[criterios.length - 1] += ` ${texto}`;
    }
  }
  return criterios;
}

/** La revisión más reciente de un repo: los archivos van numerados. */
function ultimaRevision(carpeta, repo) {
  const archivos = readdirSync(carpeta)
    .filter((n) => new RegExp(`^05-revision-${repo}-\\d+\\.json$`).test(n))
    .sort((a, b) => Number(a.match(/-(\d+)\.json$/)[1]) - Number(b.match(/-(\d+)\.json$/)[1]));
  if (archivos.length === 0) return null;
  const ruta = path.join(carpeta, archivos.at(-1));
  return { revision: leerJson(ruta), archivo: archivos.at(-1) };
}

function motorDeRevision(estado, repo) {
  const r = [...(estado.revisiones || [])].reverse().find((x) => x.repo === repo);
  return r?.motor ?? 'desconocido';
}

function construirCuerpo({ cfg, estado, carpeta, nombreRepo, spec, dependeDe }) {
  // Sin sitio configurado no inventamos una URL: mejor la clave sin link que un link roto.
  const sitio = cfg.jira?.sitio?.replace(/\/+$/, '') || null;
  const issue = estado.issue;
  const criterios = criteriosDeSpec(spec);
  const rev = ultimaRevision(carpeta, nombreRepo);
  const verificacion = leerJson(path.join(carpeta, '06-verificacion.json'));
  const motor = motorDeRevision(estado, nombreRepo);

  const lineas = [];
  lineas.push(sitio ? `**Issue:** [${issue}](${sitio}/browse/${issue})` : `**Issue:** ${issue}`);
  lineas.push(`**Spec:** \`${path.relative(RAIZ, path.join(carpeta, '01-spec.md')).replace(/\\/g, '/')}\``);
  lineas.push('');

  const contexto = spec.split(/^##\s+Contexto y problema\s*$/mi)[1]?.split(/^##\s/m)[0]?.trim();
  if (contexto) {
    lineas.push('## Qué resuelve', '', contexto, '');
  }

  if (criterios.length) {
    lineas.push('## Criterios de aceptación', '');
    criterios.forEach((c) => lineas.push(`- [ ] ${c}`));
    lineas.push('');
  }

  const pasos = verificacion?.repos?.find((r) => r.repo === nombreRepo)?.pasos || [];
  if (pasos.length) {
    lineas.push('## Verificación', '', '| Gate | Resultado |', '|---|---|');
    pasos.forEach((p) => {
      const estadoPaso = p.salteado ? `salteado (${p.motivo})` : p.ok ? 'OK' : 'FALLÓ';
      lineas.push(`| ${p.nombre} | ${estadoPaso} |`);
    });
    lineas.push('');
  }

  if (rev?.revision) {
    lineas.push(`**Revisión independiente:** \`${motor}\` — veredicto \`${rev.revision.verdict}\``);
    if (motor === 'anfitriona') {
      lineas.push('');
      lineas.push(
        '> La revisión la hizo la misma IA que implementó (con contexto limpio, pero misma familia ' +
        'de modelo). Conviene mirar el diff con algo más de atención.'
      );
    }
    const noBloqueantes = (rev.revision.findings || []).filter((f) => ['medium', 'low'].includes(f.severity));
    if (noBloqueantes.length) {
      lineas.push('', '### Hallazgos no bloqueantes', '');
      noBloqueantes.forEach((f) => lineas.push(`- **${f.severity}** · ${f.title} — \`${f.file}:${f.line_start}\``));
    }

    // Un hallazgo refutado se declara en el PR: la revisión humana tiene que poder discrepar.
    const refutaciones = readdirSync(carpeta).filter((n) => /-refutacion\.md$/.test(n));
    if (refutaciones.length) {
      lineas.push('', '### Hallazgos refutados', '');
      lineas.push(
        `La revisión marcó ${refutaciones.length} hallazgo(s) que no se reprodujeron. ` +
        `La evidencia está en la carpeta de la spec:`
      );
      refutaciones.forEach((n) => lineas.push(`- \`${path.relative(RAIZ, path.join(carpeta, n)).replace(/\\/g, '/')}\``));
      lineas.push('', 'Si no estás de acuerdo con alguna refutación, decilo en el PR.');
    }
    lineas.push('');
  }

  if (dependeDe) {
    lineas.push('---', '', `**Depende de:** ${dependeDe}. Mergear ese primero.`, '');
  }

  return lineas.join('\n');
}

function crearPr({ gh, repoGh, base, rama, titulo, cuerpoArchivo }) {
  const r = correr(gh, [
    'pr', 'create',
    '--repo', repoGh,
    '--base', base,
    '--head', rama,
    '--title', titulo,
    '--body-file', cuerpoArchivo,
  ]);
  if (r.status !== 0) return { ok: false, detalle: r.salida.trim() };
  const url = (r.salida.match(/https:\/\/github\.com\/\S+/) || [])[0] || null;
  return { ok: true, url };
}

// ─── Main ─────────────────────────────────────────────────────────────────

const args = parsearArgs(process.argv.slice(2));

try {
  const cfg = cargarConfig();
  if (!args.tarea) throw new Error('Falta --tarea (por ejemplo: --tarea PLAN-12)');

  const carpeta = carpetaDeTarea(args.tarea);
  if (!carpeta) throw new Error(`No encontré specs/ para ${args.tarea}.`);
  const estado = leerJson(path.join(carpeta, 'estado.json'));
  const rutaSpec = path.join(carpeta, '01-spec.md');
  const spec = existsSync(rutaSpec) ? readFileSync(rutaSpec, 'utf8') : '';

  const gh = resolverBin('gh');
  if (!gh && !args.simular) {
    throw new Error(
      'No se encontró `gh` (GitHub CLI). Instalalo y corré `gh auth login`, o usá --simular ' +
      'para ver los cuerpos sin crear nada.'
    );
  }

  // El orden sale de workspace.json, no de una lista fija: sumar un repo no debe tocar este script.
  // El que produce el contrato de API va primero, y su PR es el que referencian los demás.
  const orden = [...(estado.alcance || [])].sort(
    (a, b) => (cfg.repos[a]?.orden ?? 99) - (cfg.repos[b]?.orden ?? 99)
  );
  const repoDelContrato = orden.find((r) => cfg.repos[r]?.produceContratoApi);
  const dirTmp = path.join(carpeta, '.tmp');
  mkdirSync(dirTmp, { recursive: true });

  const resultados = [];
  let urlContrato = null;

  for (const nombreRepo of orden) {
    const repo = cfg.repos[nombreRepo];
    const repoGh = repoDeUrl(repo.url);
    if (!repoGh) {
      resultados.push({ repo: nombreRepo, ok: false, detalle: `No pude deducir owner/repo de ${repo.url}` });
      continue;
    }

    // Todo repo que consume el contrato depende del que lo produce, no sólo uno en particular.
    const dependeDe = nombreRepo !== repoDelContrato ? urlContrato : null;
    const cuerpo = construirCuerpo({ cfg, estado, carpeta, nombreRepo, spec, dependeDe });
    const archivoCuerpo = path.join(dirTmp, `pr-${nombreRepo}.md`);
    writeFileSync(archivoCuerpo, cuerpo, 'utf8');

    const titulo = `${estado.issue}: ${estado.titulo || estado.slug}`;

    if (args.simular) {
      resultados.push({ repo: nombreRepo, ok: true, simulado: true, repoGh, titulo,
        cuerpo: path.relative(RAIZ, archivoCuerpo) });
      // Para que el enlace entre PRs se pueda verificar sin crear nada de verdad.
      if (nombreRepo === repoDelContrato) urlContrato = `https://github.com/${repoGh}/pull/<simulado>`;
      continue;
    }

    const r = crearPr({ gh, repoGh, base: repo.ramaBase, rama: estado.rama, titulo,
      cuerpoArchivo: archivoCuerpo });
    resultados.push({ repo: nombreRepo, ...r, repoGh, titulo });
    if (nombreRepo === repoDelContrato && r.ok) urlContrato = r.url;
  }

  // El enlace queda en los dos sentidos: el PR del contrato lista a todos los que dependen de él.
  const dependientes = resultados.filter((r) => r.repo !== repoDelContrato && r.ok && r.url);
  if (!args.simular && urlContrato && dependientes.length) {
    const prContrato = resultados.find((r) => r.repo === repoDelContrato);
    const nroContrato = urlContrato.match(/\/pull\/(\d+)/)?.[1];
    if (nroContrato) {
      const archivo = path.join(dirTmp, `pr-${repoDelContrato}.md`);
      const lista = dependientes.map((d) => `- ${d.url} (${d.repo})`).join('\n');
      const cuerpo = readFileSync(archivo, 'utf8') +
        `\n---\n\n**PRs relacionados**, que dependen de este y hay que mergear después:\n\n${lista}\n`;
      writeFileSync(archivo, cuerpo, 'utf8');
      correr(gh, ['pr', 'edit', nroContrato, '--repo', prContrato.repoGh, '--body-file', archivo]);
    }
  }

  const fallados = resultados.filter((r) => !r.ok);
  emitir({
    ok: fallados.length === 0,
    tarea: estado.issue,
    rama: estado.rama,
    simulado: Boolean(args.simular),
    prs: resultados,
    siguientePaso: fallados.length === 0 && !args.simular
      ? `Transicionar ${estado.issue} a "En revisión" y comentar los links en el issue.`
      : null,
  }, fallados.length === 0 ? 0 : 1);
} catch (e) {
  emitir({ ok: false, error: e.message }, 1);
}
