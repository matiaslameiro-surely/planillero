#!/usr/bin/env node
// Qué tarea sigue, y por qué.
//
// El acceso a Jira lo tiene la IA (vía MCP), no este proceso. Por eso el script se parte en dos:
// emite la consulta, y después aplica el criterio de selección sobre lo que la consulta devolvió.
// Lo importante —el criterio— queda determinístico y auditable, sin pedir credenciales nuevas.
//
//   node .agents/scripts/cola.mjs consultar
//       → imprime el JQL y los campos a pedir. Ejecutalo con tu herramienta de Jira.
//
//   node .agents/scripts/cola.mjs elegir --yo <accountId> < issues.json
//       → aplica el criterio y dice cuál eligió y por qué. No ejecuta nada más.

import { cargarConfig, parsearArgs, emitir } from './lib/config.mjs';

// Mayor número = más prioritario. Jira devuelve el nombre, no un orden utilizable.
const PESO_PRIORIDAD = {
  highest: 5, high: 4, medium: 3, low: 2, lowest: 1,
  'más alta': 5, alta: 4, media: 3, baja: 2, 'más baja': 1,
};

function pesoDe(issue) {
  const nombre = issue?.fields?.priority?.name?.toLowerCase?.() ?? '';
  return PESO_PRIORIDAD[nombre] ?? 3; // sin prioridad = tratada como media
}

function numeroDe(issue) {
  const m = String(issue.key || '').match(/-(\d+)$/);
  return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER;
}

function leerStdin() {
  return new Promise((resolve, reject) => {
    let datos = '';
    if (process.stdin.isTTY) return resolve(null);
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (d) => { datos += d; });
    process.stdin.on('end', () => resolve(datos.trim() || null));
    process.stdin.on('error', reject);
  });
}

/**
 * Criterio, en este orden:
 *   1. Asignadas a vos, la de mayor prioridad.
 *   2. Si no hay ninguna, la de mayor prioridad del proyecto.
 * Ante empate de prioridad, la de número de issue más bajo: es la que lleva más tiempo esperando.
 */
function elegir(issues, miAccountId) {
  const abiertas = issues.filter((i) => i?.key);
  if (abiertas.length === 0) {
    return { elegida: null, motivo: 'No hay tareas en "Por hacer" en el proyecto.', candidatas: [] };
  }

  const mias = miAccountId
    ? abiertas.filter((i) => i?.fields?.assignee?.accountId === miAccountId)
    : [];

  const grupo = mias.length > 0 ? mias : abiertas;
  const etiquetaGrupo = mias.length > 0 ? 'asignadas a vos' : 'sin asignar o de otros';

  const ordenadas = [...grupo].sort(
    (a, b) => pesoDe(b) - pesoDe(a) || numeroDe(a) - numeroDe(b)
  );
  const elegida = ordenadas[0];
  const prioridad = elegida.fields?.priority?.name ?? 'sin prioridad';

  const empatadas = ordenadas.filter((i) => pesoDe(i) === pesoDe(elegida)).length;
  const cuantasMias =
    mias.length === 1 ? 'la única asignada a vos' : `las ${mias.length} asignadas a vos`;
  const motivo =
    mias.length > 0
      ? `Es ${mias.length === 1 ? cuantasMias : `la de mayor prioridad (${prioridad}) entre ${cuantasMias}`}.`
      : `No hay ninguna asignada a vos, así que se tomó la de mayor prioridad del proyecto (${prioridad}).` +
        (empatadas > 1 ? ` Había ${empatadas} empatadas en prioridad; se eligió la de número más bajo.` : '');

  return {
    elegida: {
      key: elegida.key,
      titulo: elegida.fields?.summary ?? null,
      prioridad,
      asignada: elegida.fields?.assignee?.displayName ?? null,
      tipo: elegida.fields?.issuetype?.name ?? null,
    },
    motivo,
    grupoEvaluado: etiquetaGrupo,
    candidatas: ordenadas.slice(0, 5).map((i) => ({
      key: i.key,
      titulo: i.fields?.summary ?? null,
      prioridad: i.fields?.priority?.name ?? 'sin prioridad',
      asignada: i.fields?.assignee?.displayName ?? null,
    })),
  };
}

const args = parsearArgs(process.argv.slice(2));
const comando = args._[0] || 'consultar';

try {
  const cfg = cargarConfig();
  const proyecto = cfg.jira.proyecto;

  if (comando === 'consultar') {
    emitir({
      ok: true,
      instrucciones: [
        'Ejecutá esta consulta con tu herramienta de Jira (MCP de Atlassian).',
        'Pedí también tu propio accountId (atlassianUserInfo).',
        'Después pasá el resultado a: node .agents/scripts/cola.mjs elegir --yo <accountId>',
        'El JSON de entrada puede ser {"issues":[...]} o directamente el array de issues.',
      ],
      cloudId: cfg.jira.cloudId,
      jql: `project = ${proyecto} AND statusCategory = "To Do" ORDER BY priority DESC, created ASC`,
      campos: ['summary', 'status', 'priority', 'assignee', 'issuetype'],
      maxResults: 50,
    });
  } else if (comando === 'elegir') {
    const crudo = await leerStdin();
    if (!crudo) {
      throw new Error(
        'No llegó nada por stdin. Pasá el resultado de la consulta: ' +
        '`node .agents/scripts/cola.mjs elegir --yo <accountId> < issues.json`'
      );
    }
    let datos;
    try {
      datos = JSON.parse(crudo);
    } catch (e) {
      throw new Error(`La entrada no es JSON válido: ${e.message}`);
    }
    // Aceptamos varias formas: el envoltorio del MCP, {issues:[...]}, o el array pelado.
    const issues = Array.isArray(datos)
      ? datos
      : datos.issues || datos.data?.issues || datos.data || [];
    if (!Array.isArray(issues)) {
      throw new Error('No encontré un array de issues en la entrada.');
    }

    const yo = args.yo === true ? null : args.yo;
    const resultado = elegir(issues, yo);
    emitir({
      ok: true,
      total: issues.length,
      identificado: Boolean(yo),
      ...resultado,
      siguientePaso: resultado.elegida
        ? `node .agents/scripts/estado.mjs crear --issue ${resultado.elegida.key} --titulo "${(resultado.elegida.titulo || '').replace(/"/g, "'")}" --alcance <backend|frontend|backend,frontend>`
        : null,
    });
  } else {
    throw new Error(`Comando desconocido: "${comando}". Usá: consultar | elegir`);
  }
} catch (e) {
  emitir({ ok: false, error: e.message }, 1);
}
