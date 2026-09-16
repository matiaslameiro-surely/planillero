// Carga y validación de la configuración del workspace.
// Usado por todos los scripts del harness. Sólo librería estándar de Node.

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Este archivo vive en .agents/scripts/lib/, así que la raíz del workspace está tres niveles arriba.
export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
export const RUTA_COMPARTIDA = path.join(RAIZ, 'workspace.json');
export const RUTA_LOCAL = path.join(RAIZ, 'workspace.local.json');
export const RUTA_CACHE = path.join(RAIZ, '.agents', '.cache');

/** Claves que NO deben aparecer en workspace.json: son personales, van en el local. */
const CLAVES_PERSONALES = ['JAVA_HOME', 'motores', 'token', 'rutaJdk'];

export function leerJson(ruta, porDefecto = null) {
  if (!existsSync(ruta)) return porDefecto;
  try {
    return JSON.parse(readFileSync(ruta, 'utf8'));
  } catch (e) {
    throw new Error(`${path.relative(RAIZ, ruta)} no es JSON válido: ${e.message}`);
  }
}

export function escribirJson(ruta, datos) {
  mkdirSync(path.dirname(ruta), { recursive: true });
  writeFileSync(ruta, JSON.stringify(datos, null, 2) + '\n', 'utf8');
}

/** Mezcla profunda: lo local pisa lo compartido. Los arrays se reemplazan, no se concatenan. */
function mezclar(base, encima) {
  if (Array.isArray(encima) || encima === null) return encima;
  if (typeof encima !== 'object' || typeof base !== 'object' || base === null) return encima;
  const salida = { ...base };
  for (const [k, v] of Object.entries(encima)) {
    salida[k] = k in base ? mezclar(base[k], v) : v;
  }
  return salida;
}

/** Busca claves personales filtradas al archivo compartido (el error más fácil de cometer). */
export function detectarClavesPersonales(obj, prefijo = '') {
  const encontradas = [];
  if (!obj || typeof obj !== 'object') return encontradas;
  for (const [k, v] of Object.entries(obj)) {
    const ruta = prefijo ? `${prefijo}.${k}` : k;
    if (CLAVES_PERSONALES.includes(k)) encontradas.push(ruta);
    if (v && typeof v === 'object') encontradas.push(...detectarClavesPersonales(v, ruta));
  }
  return encontradas;
}

/**
 * Configuración efectiva = workspace.json + workspace.local.json.
 * `local` queda aparte para poder distinguir qué vino de dónde.
 */
export function cargarConfig() {
  const compartida = leerJson(RUTA_COMPARTIDA);
  if (!compartida) {
    throw new Error(
      'Falta workspace.json en la raíz del repo. ¿Estás parado en el workspace de Planillero?'
    );
  }
  const local = leerJson(RUTA_LOCAL, {});
  const cfg = mezclar(compartida, local);
  cfg.$local = local;
  cfg.$hayLocal = existsSync(RUTA_LOCAL);
  cfg.$clavesPersonalesFiltradas = detectarClavesPersonales(compartida);
  return cfg;
}

/** Los repos que toca una tarea, con su configuración ya resuelta. */
export function reposDelAlcance(cfg, alcance) {
  return alcance.map((nombre) => {
    const repo = cfg.repos[nombre];
    if (!repo) throw new Error(`El repo "${nombre}" no está definido en workspace.json`);
    return { nombre, ...repo, rutaAbsoluta: path.join(RAIZ, repo.ruta) };
  });
}

/** Convierte un título de issue en un slug usable como nombre de rama. */
export function slugificar(texto, maxLargo = 40) {
  return (
    texto
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '') // saca tildes
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, maxLargo)
      .replace(/-+$/g, '') || 'tarea'
  );
}

/** Parseo mínimo de argumentos: --clave valor, --bandera, y posicionales. */
export function parsearArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) {
      args._.push(a);
      continue;
    }
    const clave = a.slice(2);
    const siguiente = argv[i + 1];
    if (siguiente === undefined || siguiente.startsWith('--')) {
      args[clave] = true;
    } else {
      args[clave] = siguiente;
      i++;
    }
  }
  return args;
}

/** Salida JSON por stdout. Los scripts del harness siempre hablan JSON. */
export function emitir(obj, codigo = 0) {
  process.stdout.write(JSON.stringify(obj, null, 2) + '\n');
  process.exitCode = codigo;
}

export const esWindows = process.platform === 'win32';
