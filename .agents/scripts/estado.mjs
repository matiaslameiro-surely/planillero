#!/usr/bin/env node
// Estado de una tarea. Es la fuente de verdad del avance: la conversación no lo es.
//
//   node .agents/scripts/estado.mjs listar
//   node .agents/scripts/estado.mjs crear --issue PLAN-12 --titulo "Carga de planilla" --alcance backend,frontend
//   node .agents/scripts/estado.mjs get --tarea PLAN-12
//   node .agents/scripts/estado.mjs set --tarea PLAN-12 --fase spec --estado ok [--nota "..."]
//   node .agents/scripts/estado.mjs anotar --tarea PLAN-12 --clave commits.backend --valor a1b2c3d

import { existsSync, readdirSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { RAIZ, cargarConfig, leerJson, escribirJson, slugificar, parsearArgs, emitir } from './lib/config.mjs';
import { identidad } from './lib/identidad.mjs';

const DIR_SPECS = path.join(RAIZ, 'specs');
const FASES = ['preparacion', 'spec', 'plan', 'implementar', 'verificar', 'cerrar', 'cerrada'];
const ESTADOS = ['pendiente', 'en_curso', 'ok', 'bloqueada'];

/** Ubica la carpeta de una tarea por su clave de issue, sin necesidad de conocer el slug. */
function carpetaDeTarea(issue) {
  if (!existsSync(DIR_SPECS)) return null;
  const clave = issue.toUpperCase();
  const encontrada = readdirSync(DIR_SPECS, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .find((n) => n.toUpperCase() === clave || n.toUpperCase().startsWith(`${clave}-`));
  return encontrada ? path.join(DIR_SPECS, encontrada) : null;
}

function rutaEstado(carpeta) {
  return path.join(carpeta, 'estado.json');
}

function exigirTarea(issue) {
  if (!issue) throw new Error('Falta --tarea (por ejemplo: --tarea PLAN-12)');
  const carpeta = carpetaDeTarea(issue);
  if (!carpeta) throw new Error(`No existe la carpeta de ${issue} en specs/. ¿Corriste "crear" antes?`);
  const estado = leerJson(rutaEstado(carpeta));
  if (!estado) throw new Error(`${path.relative(RAIZ, rutaEstado(carpeta))} no existe o está vacío.`);
  return { carpeta, estado };
}

/** Escribe una ruta con puntos dentro de un objeto: "commits.backend" → obj.commits.backend */
function asignarProfundo(obj, ruta, valor) {
  const partes = ruta.split('.');
  let cursor = obj;
  for (const parte of partes.slice(0, -1)) {
    if (typeof cursor[parte] !== 'object' || cursor[parte] === null) cursor[parte] = {};
    cursor = cursor[parte];
  }
  cursor[partes.at(-1)] = valor;
}

const args = parsearArgs(process.argv.slice(2));
const comando = args._[0];

try {
  switch (comando) {
    case 'listar': {
      const tareas = existsSync(DIR_SPECS)
        ? readdirSync(DIR_SPECS, { withFileTypes: true })
            .filter((d) => d.isDirectory())
            .map((d) => {
              const e = leerJson(path.join(DIR_SPECS, d.name, 'estado.json'));
              return e
                ? { carpeta: d.name, issue: e.issue, titulo: e.titulo ?? null,
                    fase: e.fase, alcance: e.alcance, rama: e.rama }
                : { carpeta: d.name, issue: null, fase: 'sin-estado' };
            })
        : [];
      emitir({ ok: true, tareas, abiertas: tareas.filter((t) => t.fase !== 'cerrada').length });
      break;
    }

    case 'crear': {
      const issue = (args.issue || '').toUpperCase();
      if (!/^[A-Z]+-\d+$/.test(issue)) throw new Error('--issue tiene que ser una clave tipo PLAN-12');
      // Los repos válidos salen de workspace.json: agregar uno nuevo no debe requerir tocar este script.
      const reposValidos = Object.keys(cargarConfig().repos || {});
      const alcance = String(args.alcance || reposValidos.join(','))
        .split(',').map((s) => s.trim()).filter(Boolean);
      for (const a of alcance) {
        if (!reposValidos.includes(a)) {
          throw new Error(`Alcance inválido: "${a}". Repos disponibles: ${reposValidos.join(', ')}`);
        }
      }

      const yaExiste = carpetaDeTarea(issue);
      if (yaExiste && !args.forzar) {
        // Reanudación: no es un error, es el caso normal de retomar trabajo.
        const estado = leerJson(rutaEstado(yaExiste));
        emitir({ ok: true, reanudacion: true, carpeta: path.relative(RAIZ, yaExiste), estado });
        break;
      }

      const slug = slugificar(args.titulo || issue);
      const carpeta = yaExiste || path.join(DIR_SPECS, `${issue}-${slug}`);
      mkdirSync(carpeta, { recursive: true });

      const estado = {
        issue,
        titulo: args.titulo || null,
        slug,
        rama: `${issue}-${slug}`,
        alcance,
        fase: 'preparacion',
        fases: Object.fromEntries(FASES.map((f) => [f, { estado: 'pendiente' }])),
        commits: {},
        revisiones: [],
        pr: {},
        jira: { transicionadoA: null, creadoPorHarness: Boolean(args['creado-por-harness']) },
        // Quién resolvió la tarea. La herramienta se detecta sola; el modelo lo declara la IA
        // con --modelo, porque no hay forma confiable de deducirlo del entorno.
        ejecucion: { ...identidad({ modelo: args.modelo === true ? null : args.modelo }), fin: null },
      };
      estado.fases.preparacion = { estado: 'en_curso', ts: new Date().toISOString() };
      escribirJson(rutaEstado(carpeta), estado);
      emitir({ ok: true, reanudacion: false, carpeta: path.relative(RAIZ, carpeta), estado });
      break;
    }

    case 'get': {
      const { carpeta, estado } = exigirTarea(args.tarea);
      emitir({ ok: true, carpeta: path.relative(RAIZ, carpeta), estado });
      break;
    }

    case 'set': {
      const { carpeta, estado } = exigirTarea(args.tarea);
      const fase = args.fase;
      const nuevoEstado = args.estado;
      if (!FASES.includes(fase)) throw new Error(`Fase inválida: "${fase}". Válidas: ${FASES.join(', ')}`);
      if (!ESTADOS.includes(nuevoEstado)) {
        throw new Error(`Estado inválido: "${nuevoEstado}". Válidos: ${ESTADOS.join(', ')}`);
      }

      estado.fases[fase] = {
        ...(estado.fases[fase] || {}),
        estado: nuevoEstado,
        ts: new Date().toISOString(),
        ...(args.nota ? { nota: args.nota } : {}),
        ...(args.iteracion ? { iteracion: Number(args.iteracion) } : {}),
      };
      // La fase activa es la primera que todavía no terminó.
      estado.fase = FASES.find((f) => estado.fases[f]?.estado !== 'ok') || 'cerrada';
      // Al cerrarse se sella la hora de fin, que es lo que permite medir duración en el informe.
      if (estado.fase === 'cerrada' && estado.ejecucion && !estado.ejecucion.fin) {
        estado.ejecucion.fin = new Date().toISOString();
      }
      escribirJson(rutaEstado(carpeta), estado);

      // Marcar una fase como ok dejando anteriores sin cerrar deja la fase activa mintiendo:
      // pasa a apuntar al hueco y no al avance real. No se bloquea —a veces se retoma trabajo
      // ya hecho— pero se avisa, porque casi siempre es un paso salteado por distracción.
      const pendientesPrevias =
        nuevoEstado === 'ok'
          ? FASES.slice(0, FASES.indexOf(fase)).filter((f) => estado.fases[f]?.estado !== 'ok')
          : [];

      emitir({
        ok: true,
        fase: estado.fase,
        fases: estado.fases,
        ...(pendientesPrevias.length
          ? {
              aviso:
                `Marcaste "${fase}" como ok pero quedaron sin cerrar fases anteriores: ` +
                `${pendientesPrevias.join(', ')}. Por eso la fase activa figura como ` +
                `"${estado.fase}". Cerralas o revisá si te salteaste un paso.`,
              pendientesPrevias,
            }
          : {}),
      });
      break;
    }

    case 'anotar': {
      const { carpeta, estado } = exigirTarea(args.tarea);
      if (!args.clave) throw new Error('Falta --clave (por ejemplo: --clave commits.backend)');
      let valor = args.valor;
      if (args.json) { try { valor = JSON.parse(args.valor); } catch { /* se deja como texto */ } }
      asignarProfundo(estado, args.clave, valor);
      escribirJson(rutaEstado(carpeta), estado);
      emitir({ ok: true, clave: args.clave, valor });
      break;
    }

    default:
      throw new Error(
        `Comando desconocido: "${comando ?? '(ninguno)'}". Usá: listar | crear | get | set | anotar`
      );
  }
} catch (e) {
  emitir({ ok: false, error: e.message }, 1);
}
