// Validación del resultado de una revisión y armado del prompt.
// Separado de revisar.mjs para poder probarlo solo.

import { readFileSync } from 'node:fs';

/**
 * Validación estructural contra revision.schema.json.
 * A propósito no usamos una librería de JSON Schema: el harness no tiene dependencias,
 * y lo que necesitamos verificar son seis campos. Devuelve la lista de errores.
 */
export function validarRevision(obj) {
  const errores = [];
  const esTextoNoVacio = (v) => typeof v === 'string' && v.trim().length > 0;

  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return ['La revisión tiene que ser un objeto JSON.'];
  }
  if (!['approve', 'needs-attention'].includes(obj.verdict)) {
    errores.push(`verdict inválido: ${JSON.stringify(obj.verdict)} (approve | needs-attention)`);
  }
  if (!esTextoNoVacio(obj.summary)) errores.push('summary tiene que ser texto no vacío.');
  if (!Array.isArray(obj.findings)) {
    errores.push('findings tiene que ser un array.');
  } else {
    obj.findings.forEach((f, i) => {
      const p = `findings[${i}]`;
      if (!f || typeof f !== 'object') return errores.push(`${p} tiene que ser un objeto.`);
      if (!['critical', 'high', 'medium', 'low'].includes(f.severity)) {
        errores.push(`${p}.severity inválido: ${JSON.stringify(f.severity)}`);
      }
      for (const campo of ['title', 'body', 'file']) {
        if (!esTextoNoVacio(f[campo])) errores.push(`${p}.${campo} tiene que ser texto no vacío.`);
      }
      for (const campo of ['line_start', 'line_end']) {
        if (!Number.isInteger(f[campo]) || f[campo] < 1) {
          errores.push(`${p}.${campo} tiene que ser un entero mayor o igual a 1.`);
        }
      }
      if (typeof f.confidence !== 'number' || f.confidence < 0 || f.confidence > 1) {
        errores.push(`${p}.confidence tiene que ser un número entre 0 y 1.`);
      }
      if (typeof f.recommendation !== 'string') errores.push(`${p}.recommendation tiene que ser texto.`);
    });
  }
  if (!Array.isArray(obj.next_steps)) errores.push('next_steps tiene que ser un array de textos.');

  return errores;
}

export function hallazgosBloqueantes(revision, severidades) {
  return (revision?.findings || []).filter((f) => severidades.includes(f.severity));
}

const MAX_DIFF = 200_000; // más que esto no mejora la revisión y sí arruina el contexto

export function recortarDiff(diff) {
  if (diff.length <= MAX_DIFF) return { diff, recortado: false };
  return {
    diff: diff.slice(0, MAX_DIFF) + '\n\n[… diff recortado por tamaño …]',
    recortado: true,
  };
}

/**
 * El prompt lo arma el script y no la IA que orquesta: así la revisión es siempre la misma
 * pregunta, y dos corridas se pueden comparar entre sí.
 */
export function construirPrompt({ repo, rama, ramaBase, spec, diff, esquemaRuta }) {
  const esquema = readFileSync(esquemaRuta, 'utf8');
  return `Sos un revisor de código independiente. Revisá los cambios de la rama \`${rama}\` del repo
\`${repo}\` contra la especificación de la tarea.

Reglas de la revisión:
- Respondé ÚNICAMENTE con un objeto JSON que cumpla el esquema de más abajo. Sin texto alrededor.
- Escribí el contenido en español (summary, title, body, recommendation, next_steps).
- Buscá defectos reales: errores de lógica, casos borde sin cubrir, condiciones de carrera, validación
  faltante, fugas de recursos, problemas de seguridad, y criterios de aceptación no cumplidos.
- Para cada hallazgo, describí el escenario concreto que falla. Si no podés describirlo, no es un
  hallazgo: bajale la confianza o no lo reportes.
- No reportes cuestiones de estilo o preferencia personal si no afectan el comportamiento.
- Usá severity \`critical\` o \`high\` sólo para lo que debería frenar el merge.
- Si no encontrás nada que frene el merge, usá verdict \`approve\` con findings vacío o sólo
  \`medium\`/\`low\`.

=== ESPECIFICACIÓN DE LA TAREA ===
${spec}

=== DIFF (${ramaBase}...${rama}) ===
${diff}

=== ESQUEMA DE RESPUESTA (JSON Schema) ===
${esquema}
`;
}
