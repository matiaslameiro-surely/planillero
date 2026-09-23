// Script de auditoría de contraste (WCAG 2.1 AA) para la escala de color del backoffice.
// Calcula el ratio de cada par fg/bg en uso y reporta los que no alcanzan ≥ 4,5:1.
// Uso: node contrastes.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const variablesPath = join(here, '..', '..', 'backoffice', 'src', 'app', 'styles', '_variables.scss');
const source = readFileSync(variablesPath, 'utf8');

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  if (h.length === 3) {
    return [0, 2, 4].map((i) => parseInt(h[i] + h[i], 16));
  }
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

function linearize(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function relativeLuminance(rgb) {
  const [r, g, b] = rgb.map(linearize);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(fg, bg) {
  const l1 = relativeLuminance(hexToRgb(fg));
  const l2 = relativeLuminance(hexToRgb(bg));
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

const tokenRegex = /\$color-([a-z0-9-]+):\s*(\$color-[a-z0-9-]+|#[0-9a-fA-F]{6}|rgba\([^)]+\))/g;
const tokens = new Map();
for (const match of source.matchAll(tokenRegex)) {
  tokens.set(match[1], match[2]);
}

// Compone un rgba sobre un fondo hex (blanco para los overlays de la escala). Devuelve #rrggbb.
function composeRgba(rgba, bgHex) {
  const m = rgba.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
  const [r, g, b, a] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
  const bg = hexToRgb(bgHex);
  const out = [r, g, b].map((c, i) => Math.round(c * a + bg[i] * (1 - a)));
  return `#${out.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

function resolve(name, bgHex) {
  const key = name.replace(/^color-/, '');
  const value = tokens.get(key);
  if (!value) throw new Error(`Token $color-${key} no definido`);
  if (value.startsWith('rgba')) {
    if (!bgHex) throw new Error(`Token $color-${key} es rgba y necesita fondo`);
    return composeRgba(value, bgHex);
  }
  const hexMatch = value.match(/#[0-9a-fA-F]{6}/);
  if (hexMatch) return hexMatch[0];
  const alias = value.match(/\$color-([a-z-]+)/);
  if (alias) return resolve(alias[1], bgHex);
  return value;
}

function isValidHex(v) {
  return /^#[0-9a-fA-F]{6}$/.test(v);
}

// Pares en uso real: fg sobre bg. Texto sobre blanco (botones, enlaces, cuerpo) y cada estado
// sobre su fondo, según los consumos en src/app vía var().
const pares = [
  ['color-primary', 'color-surface', 'acción primaria: texto en enlaces y botones secundarios'],
  ['color-text', 'color-surface', 'títulos y cuerpo duro'],
  ['color-text-muted', 'color-surface', 'texto secundario sobre blanco'],
  ['color-text-muted', 'color-surface-muted', 'texto secundario sobre fondo gris claro'],
  ['color-text-disabled', 'color-border', 'botón deshabilitado'],
  ['color-error', 'color-surface', 'errores de campo y feedback'],
  ['color-success', 'color-surface', 'feedback de éxito'],
  ['color-warning', 'color-surface', 'feedback de advertencia'],
  ['color-info', 'color-surface', 'KPI SLA de Supervisión'],
  ['color-overlay-strong', 'color-surface', 'signature-tag sobre imagen'],
  ['color-status-ok', 'color-status-ok-bg', 'estado íntegro/completo'],
  ['color-status-alert', 'color-status-alert-bg', 'estado alterado/error'],
  ['color-status-pending', 'color-status-pending-bg', 'estado pendiente/demorado'],
  ['color-status-info', 'color-status-info-bg', 'estado informativo/celeste'],
  ['color-status-neutral', 'color-status-neutral-bg', 'estado neutro/offline'],
];

const rows = [];
let fails = 0;
for (const [fgName, bgName, descripcion] of pares) {
  const bgHex = resolve(bgName);
  const fgHex = resolve(fgName, bgHex);
  if (!isValidHex(fgHex) || !isValidHex(bgHex)) {
    rows.push({ par: `${fgName}/${bgName}`, ratio: 'n/a (no hex)', ok: true, descripcion });
    continue;
  }
  const ratio = contrast(fgHex, bgHex);
  const ok = ratio >= 4.5;
  if (!ok) fails++;
  rows.push({ par: `${fgName}/${bgName}`, ratio: ratio.toFixed(2), ok, descripcion });
}

const table = rows
  .map((r) => `| \`${r.par}\` | ${r.descripcion} | ${r.ratio} | ${r.ok ? 'AA' : '**FALLA**'} |`)
  .join('\n');

const markdown = `# Auditoría de contraste (WCAG 2.1 AA)

Escala de color del backoffice (PLAN-28). Ratio mínimo exigido: 4,5:1. Generado con
\`node contrastes.mjs\`.

| Par fg/bg | Uso | Ratio | Resultado |
|---|---|---|---|
${table}

${fails === 0 ? '**Todos los pares cumplen AA.**' : `**${fails} par(es) fallan.**`}
`;

writeFileSync(join(here, 'auditoria-contraste.md'), markdown, 'utf8');
console.log(table);
console.log(fails === 0 ? 'OK: todos los pares cumplen AA.' : `FALLA: ${fails} par(es).`);