// Quién está ejecutando el harness.
//
// Se registra en el estado de cada tarea para poder analizar después con qué IA se resolvió cada
// una. La herramienta se detecta sola por variables de entorno; el modelo no es detectable de forma
// confiable, así que lo declara quien lo sabe (la propia IA, al crear la tarea).

/**
 * Señales de entorno de cada herramienta conocida. Sumar una es agregar una entrada:
 * ninguna otra parte del harness sabe qué herramientas existen.
 */
const SENIALES = [
  { herramienta: 'Claude Code', vars: ['CLAUDECODE', 'CLAUDE_CODE_ENTRYPOINT'] },
  { herramienta: 'Codex CLI', vars: ['CODEX_SANDBOX', 'CODEX_THREAD_ID', 'CODEX_SESSION_ID'] },
  { herramienta: 'Cursor', vars: ['CURSOR_AGENT', 'CURSOR_TRACE_ID'] },
  { herramienta: 'Gemini CLI', vars: ['GEMINI_CLI', 'GEMINI_SESSION_ID'] },
  { herramienta: 'Aider', vars: ['AIDER_MODEL'] },
  { herramienta: 'GitHub Copilot', vars: ['COPILOT_AGENT_ID'] },
];

/** Detecta la herramienta anfitriona, o null si no se reconoce ninguna. */
export function detectarHerramienta(env = process.env) {
  for (const { herramienta, vars } of SENIALES) {
    if (vars.some((v) => env[v])) return herramienta;
  }
  return null;
}

/**
 * Identidad de quien ejecuta: herramienta detectada y modelo declarado.
 *
 * `modelo` llega por parámetro porque no hay forma confiable de deducirlo del entorno. Si nadie lo
 * declara queda en null, y el informe lo muestra como "no informado" en vez de inventarlo.
 */
export function identidad({ modelo = null, env = process.env } = {}) {
  return {
    herramienta: detectarHerramienta(env),
    modelo: modelo || env.HARNESS_MODELO || null,
    ts: new Date().toISOString(),
  };
}
