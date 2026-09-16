// Ejecución de subprocesos multiplataforma, con el entrecomillado de Windows resuelto.
//
// El problema: en Windows, un ejecutable .cmd o .bat (como `codex`, `npm` o `mvnw`) sólo se puede
// lanzar a través del shell. Pero `spawn(bin, args, {shell:true})` **concatena los argumentos sin
// escaparlos**, así que cualquier ruta con espacios —`C:\Users\Juan Perez\...`— se parte en dos y el
// comando falla de forma incomprensible. Node además avisa de esto como problema de seguridad.
//
// La solución es entrecomillar nosotros cada argumento antes de dárselo al shell.

import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

export const esWindows = process.platform === 'win32';

// Node avisa (DEP0190) de que `shell:true` concatena los argumentos sin escaparlos.
// Es un aviso correcto en general, pero acá ya no aplica: `citarWin` los entrecomilla antes,
// que es justamente la mitigación que el aviso pide. Se lo silencia para no ensuciar la salida
// de los scripts con una advertencia alarmante que no corresponde; el resto de los warnings sigue.
process.on('warning', (w) => {
  if (w.name === 'DeprecationWarning' && /shell option/i.test(w.message)) return;
  console.warn(`${w.name}: ${w.message}`);
});

/**
 * Ubicaciones habituales de herramientas que suelen no estar todavía en el PATH de una
 * terminal abierta antes de instalarlas.
 */
const RUTAS_EXTRA = {
  gh: esWindows
    ? ['C:\\Program Files\\GitHub CLI\\gh.exe', 'C:\\Program Files (x86)\\GitHub CLI\\gh.exe']
    : ['/usr/local/bin/gh', '/opt/homebrew/bin/gh'],
};

/**
 * Busca un ejecutable en el PATH y devuelve su ruta completa.
 * Hace falta resolverla porque spawn sin shell no aplica PATHEXT: pedirle `codex` en Windows
 * da ENOENT aunque exista `codex.CMD`.
 */
export function resolverBin(nombre, pathEnv = process.env.PATH) {
  if (nombre.includes(path.sep) || nombre.includes('/')) {
    return existsSync(nombre) ? nombre : null;
  }
  const dirs = (pathEnv || '').split(path.delimiter).filter(Boolean);
  // En Windows la extensión NO es opcional: junto a `codex.CMD` suele haber un archivo `codex`
  // sin extensión (el script POSIX que instala npm), que Windows no sabe ejecutar. Si probáramos
  // primero la extensión vacía, resolveríamos justo el que no funciona.
  const exts = esWindows
    ? (process.env.PATHEXT || '.EXE;.CMD;.BAT').split(';').filter(Boolean)
    : [''];
  for (const dir of dirs) {
    for (const ext of exts) {
      const completo = path.join(dir, nombre + ext);
      try {
        if (existsSync(completo)) return completo;
      } catch { /* directorio inaccesible */ }
    }
  }
  for (const extra of RUTAS_EXTRA[nombre] || []) {
    if (existsSync(extra)) return extra;
  }
  return null;
}

/** Un ejecutable que el shell de Windows tiene que interpretar (no se puede lanzar directo). */
export function necesitaShell(bin) {
  return esWindows && /\.(cmd|bat)$/i.test(bin);
}

/**
 * Entrecomillado para cmd.exe. Envuelve en comillas dobles si hace falta y escapa las internas.
 * Sin esto, `--output-schema C:\Users\Juan Perez\x.json` llega como dos argumentos.
 */
export function citarWin(arg) {
  const s = String(arg);
  if (s.length > 0 && !/[\s"^&|<>()%!]/.test(s)) return s;
  return `"${s.replace(/(\\*)"/g, '$1$1\\"').replace(/(\\+)$/, '$1$1')}"`;
}

// El PATH del `env` que se le pasa al hijo manda sobre el del proceso actual: si alguien
// antepuso el bin de un JDK para forzar su versión, `java` tiene que resolverse ahí.
function prepararInvocacion(bin, args, opciones) {
  const resuelto = resolverBin(bin, opciones?.env?.PATH ?? process.env.PATH) || bin;
  if (necesitaShell(resuelto)) {
    return { bin: citarWin(resuelto), args: args.map(citarWin), shell: true };
  }
  return { bin: resuelto, args, shell: false };
}

/** spawn asíncrono con el entrecomillado ya resuelto. */
export function lanzar(bin, args, opciones = {}) {
  const inv = prepararInvocacion(bin, args, opciones);
  return spawn(inv.bin, inv.args, { windowsHide: true, ...opciones, shell: inv.shell });
}

/** spawnSync con el entrecomillado ya resuelto. Devuelve stdout y stderr juntos. */
export function correr(bin, args, opciones = {}) {
  const inv = prepararInvocacion(bin, args, opciones);
  const r = spawnSync(inv.bin, inv.args, {
    encoding: 'utf8', windowsHide: true, ...opciones, shell: inv.shell,
  });
  return {
    ...r,
    salida: `${r.stdout || ''}${r.stderr || ''}`,
  };
}

/** Mata un proceso y toda su descendencia. Un CLI de IA suele lanzar hijos propios. */
export function matarArbol(pid) {
  if (!pid) return;
  try {
    if (esWindows) spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
    else process.kill(-pid, 'SIGTERM');
  } catch { /* ya había terminado */ }
}
