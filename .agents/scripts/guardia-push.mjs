#!/usr/bin/env node
// Guardia de push. Se instala como hook `pre-push` de git en los repos de producto,
// así protege a todo el equipo sin importar qué asistente de IA use cada uno —y también
// cuando alguien pushea a mano desde la terminal.
//
// Git le pasa por stdin una línea por referencia a pushear:
//   <ref local> <sha local> <ref remota> <sha remoto>
//
// Instalación: node .agents/scripts/guardia-push.mjs --instalar
// Prueba:      node .agents/scripts/guardia-push.mjs --probar refs/heads/main

import { writeFileSync, chmodSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { RAIZ, cargarConfig, parsearArgs } from './lib/config.mjs';

const PROTEGIDAS = new Set(['main', 'master', 'develop', 'produccion', 'production']);

function nombreDeRef(ref) {
  return (ref || '').replace(/^refs\/heads\//, '');
}

function esProtegida(ref) {
  return PROTEGIDAS.has(nombreDeRef(ref));
}

function leerStdin() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) return resolve('');
    let datos = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (d) => { datos += d; });
    process.stdin.on('end', () => resolve(datos));
    process.stdin.on('error', () => resolve(''));
  });
}

function instalar() {
  const cfg = cargarConfig();
  const resultados = [];
  for (const [nombre, repo] of Object.entries(cfg.repos || {})) {
    // El harness no lleva guardia: el equipo sube ahí las specs de cada tarea de producto directo a
    // `main`, y bloquearlo cambiaría cómo trabaja todo el mundo. Si algún día las specs pasan por PR,
    // se decide aparte.
    if (repo.tipo === 'harness') {
      resultados.push({ repo: nombre, instalado: false, motivo: 'el harness no lleva guardia de push (las specs se suben directo a main)' });
      continue;
    }
    const dirGit = path.join(RAIZ, repo.ruta, '.git');
    if (!existsSync(dirGit)) {
      resultados.push({ repo: nombre, instalado: false, motivo: 'no está clonado' });
      continue;
    }
    const dirHooks = path.join(dirGit, 'hooks');
    mkdirSync(dirHooks, { recursive: true });
    const destino = path.join(dirHooks, 'pre-push');

    // El hook es un shell script porque es lo que git ejecuta en todas las plataformas
    // (en Windows lo corre con el bash que viene con Git). Delega en este mismo archivo.
    const contenido =
      '#!/bin/sh\n' +
      '# Instalado por el harness de Planillero. Bloquea el push directo a ramas protegidas.\n' +
      '# Para saltearlo de forma deliberada: git push --no-verify\n' +
      `exec node "${path.join(RAIZ, '.agents', 'scripts', 'guardia-push.mjs').replace(/\\/g, '/')}"\n`;

    writeFileSync(destino, contenido, 'utf8');
    try { chmodSync(destino, 0o755); } catch { /* en Windows no aplica */ }
    resultados.push({ repo: nombre, instalado: true, hook: path.relative(RAIZ, destino) });
  }
  return resultados;
}

// ─── Main ─────────────────────────────────────────────────────────────────

const args = parsearArgs(process.argv.slice(2));

if (args.instalar) {
  const resultados = instalar();
  process.stdout.write(JSON.stringify({ ok: true, resultados }, null, 2) + '\n');
  process.exit(0);
}

if (args.probar) {
  const ref = args.probar === true ? 'refs/heads/main' : args.probar;
  const bloquea = esProtegida(ref);
  process.stdout.write(JSON.stringify({ ok: true, ref, bloquea }, null, 2) + '\n');
  process.exit(0);
}

// Modo hook: git nos invoca con las referencias por stdin.
const entrada = await leerStdin();
const bloqueadas = entrada
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean)
  .map((l) => l.split(/\s+/)[2]) // tercera columna: la referencia remota
  .filter((ref) => ref && esProtegida(ref))
  .map(nombreDeRef);

if (bloqueadas.length > 0) {
  const lista = [...new Set(bloqueadas)].join(', ');
  process.stderr.write(
    `\n  Push bloqueado: estás pusheando directo a ${lista}.\n\n` +
    `  El trabajo va en una rama de tarea (PLAN-<n>-<slug>) y entra por pull request.\n` +
    `  Si esto es deliberado y sabés lo que hacés: git push --no-verify\n\n`
  );
  process.exit(1);
}
process.exit(0);
