#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const RAIZ = path.resolve('.');
const mdPath = path.join(RAIZ, 'docs', 'INFORME_FINAL_ENTREGA.md');
const htmlPath = path.join(RAIZ, 'docs', 'INFORME_FINAL_ENTREGA.html');
const pdfPath = path.join(RAIZ, 'docs', 'INFORME_FINAL_ENTREGA.pdf');

console.log('1. Leyendo markdown...');
const mdContent = fs.readFileSync(mdPath, 'utf8');

console.log('2. Parseando markdown con marked...');
const markedHtml = execSync('npx --yes marked --gfm', {
  input: mdContent,
  encoding: 'utf8',
  maxBuffer: 10 * 1024 * 1024,
});

// Convertir imágenes relativas a URLs absolutas o data URIs
const htmlWithImages = markedHtml.replace(/<img\s+src="([^"]+)"/g, (match, src) => {
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
    return match;
  }
  const imgFullPath = path.resolve(RAIZ, 'docs', src);
  if (fs.existsSync(imgFullPath)) {
    const ext = path.extname(imgFullPath).slice(1).toLowerCase();
    const mime = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/svg+xml';
    const base64 = fs.readFileSync(imgFullPath).toString('base64');
    return `<img src="data:${mime};base64,${base64}"`;
  }
  return match;
});

// Reemplazar bloques mermaid
const htmlWithMermaid = htmlWithImages.replace(
  /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
  (match, code) => {
    // Decodificar entidades HTML si las hay
    const decoded = code
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"');
    return `<div class="mermaid">${decoded}</div>`;
  }
);

const fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Informe Final de Proyecto - Planillero</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    @page {
      size: A4;
      margin: 18mm 16mm 20mm 16mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.45;
      color: #1f2937;
      margin: 0;
      padding: 0;
    }
    /* Estilos de Portada Universitaria Formal (Página 1) */
    .portada-academica {
      box-sizing: border-box;
      height: 254mm;
      max-height: 254mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border: 2px solid #1e3a8a;
      border-radius: 6px;
      padding: 7mm 11mm 6mm 11mm;
      background: #ffffff;
      position: relative;
      page-break-after: always;
      break-after: page;
      text-align: center;
    }
    .portada-academica::before {
      content: "";
      position: absolute;
      top: 2.5mm;
      left: 2.5mm;
      right: 2.5mm;
      bottom: 2.5mm;
      border: 1px solid #93c5fd;
      border-radius: 4px;
      pointer-events: none;
    }
    .portada-banner-wrap {
      margin-bottom: 1.5mm;
    }
    .banner-institucional {
      width: 100% !important;
      max-width: 100% !important;
      height: auto !important;
      max-height: 22mm !important;
      display: block !important;
      margin: 0 auto !important;
      border: none !important;
      box-shadow: none !important;
      border-radius: 3px !important;
      object-fit: contain !important;
    }
    .portada-membrete {
      margin-bottom: 1mm;
    }
    .institucion-header {
      font-size: 12.5pt;
      font-weight: 800;
      color: #1e3a8a;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      line-height: 1.2;
    }
    .facultad-header {
      font-size: 10pt;
      font-weight: 600;
      color: #334155;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .catedra-header {
      font-size: 8.5pt;
      font-weight: 600;
      color: #2563eb;
      margin-top: 2px;
    }
    .sub-header {
      font-size: 8pt;
      color: #64748b;
      font-style: italic;
      margin-top: 1px;
    }
    .divisor-institucional {
      width: 60%;
      height: 1px;
      background: linear-gradient(to right, transparent, #2563eb, transparent);
      margin: 4px auto 0 auto;
    }
    .portada-cuerpo {
      margin: 2mm 0;
    }
    .proyecto-materia {
      font-size: 8pt;
      font-weight: 700;
      color: #2563eb;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .proyecto-titulo {
      font-size: 26pt !important;
      font-weight: 900 !important;
      color: #0f172a !important;
      letter-spacing: 3.5px;
      margin: 1px 0 4px 0 !important;
      border-bottom: none !important;
      padding-bottom: 0 !important;
    }
    .proyecto-subtitulo {
      font-size: 10pt;
      font-weight: 600;
      color: #1e40af;
      line-height: 1.3;
      max-width: 92%;
      margin: 0 auto 5px auto;
    }
    .proyecto-resumen {
      font-size: 7.8pt;
      color: #475569;
      line-height: 1.35;
      max-width: 95%;
      margin: 0 auto;
      background: #f8fafc;
      border-left: 3px solid #2563eb;
      padding: 4pt 7pt;
      border-radius: 0 4px 4px 0;
      text-align: justify;
    }
    .portada-ficha {
      margin: 2mm 0;
    }
    .tabla-ficha {
      width: 100% !important;
      border-collapse: collapse !important;
      font-size: 7.8pt !important;
      margin: 0 !important;
      background: #ffffff;
      text-align: left;
    }
    .tabla-ficha th {
      background: #1e3a8a !important;
      color: #ffffff !important;
      font-size: 7.8pt !important;
      letter-spacing: 1px;
      padding: 3.5pt 5pt !important;
      text-align: center !important;
      text-transform: uppercase;
    }
    .tabla-ficha td {
      border: 1px solid #cbd5e1 !important;
      padding: 3.5pt 5pt !important;
      vertical-align: middle !important;
      line-height: 1.25;
    }
    .portada-pie {
      border-top: 1px solid #cbd5e1;
      padding-top: 2.5mm;
      font-size: 7.8pt;
      color: #64748b;
    }
    .portada-pie .fecha-pie {
      font-weight: 600;
      color: #1e293b;
      margin-top: 2px;
    }
    .salto-pagina {
      page-break-after: always;
      break-after: page;
      height: 0;
      margin: 0;
      padding: 0;
    }
    h1 {
      font-size: 19pt;
      color: #0f172a;
      border-bottom: 2.5px solid #2563eb;
      padding-bottom: 4px;
      margin-top: 0;
      margin-bottom: 6pt;
    }
    h2 {
      font-size: 14pt;
      color: #1e40af;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 3px;
      margin-top: 18pt;
      margin-bottom: 8pt;
      page-break-after: avoid;
    }
    h3 {
      font-size: 11.5pt;
      color: #0f172a;
      margin-top: 13pt;
      margin-bottom: 6pt;
      page-break-after: avoid;
    }
    h4 {
      font-size: 10.5pt;
      color: #334155;
      margin-top: 10pt;
      margin-bottom: 4pt;
      page-break-after: avoid;
    }
    p, ul, ol {
      margin-top: 4pt;
      margin-bottom: 7pt;
    }
    li {
      margin-bottom: 3pt;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10pt 0 14pt 0;
      font-size: 8.5pt;
      line-height: 1.35;
      page-break-inside: auto;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 5.5pt 7pt;
      text-align: left;
      vertical-align: top;
    }
    th {
      background-color: #f1f5f9;
      font-weight: 600;
      color: #0f172a;
    }
    tr:nth-child(even) td {
      background-color: #f8fafc;
    }
    img {
      max-width: 88%;
      max-height: 380px;
      display: block;
      margin: 10pt auto;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.06);
      page-break-inside: avoid;
    }
    blockquote {
      margin: 8pt 0;
      padding: 6pt 10pt;
      background: #eff6ff;
      border-left: 3.5px solid #3b82f6;
      border-radius: 0 4px 4px 0;
      font-size: 9.5pt;
      color: #1e3a8a;
    }
    blockquote p {
      margin: 0;
    }
    pre {
      background: #0f172a;
      color: #f8fafc;
      border-radius: 6px;
      padding: 8pt 10pt;
      font-size: 8pt;
      line-height: 1.35;
      overflow-x: auto;
      page-break-inside: avoid;
      margin: 8pt 0;
    }
    code {
      font-family: Consolas, "Fira Code", Monaco, monospace;
      font-size: 8.5pt;
      background: #f1f5f9;
      padding: 1.5pt 3pt;
      border-radius: 3px;
      color: #0f172a;
    }
    pre code {
      background: none;
      padding: 0;
      color: inherit;
    }
    a {
      color: #2563eb;
      text-decoration: underline;
    }
    hr {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 14pt 0;
    }
    .mermaid {
      display: flex;
      justify-content: center;
      margin: 12pt 0;
      page-break-inside: avoid;
      background: #ffffff;
      padding: 8pt;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
    }
    .mermaid svg {
      max-width: 100%;
      height: auto;
    }
  </style>
</head>
<body>
${htmlWithMermaid}

<script>
  mermaid.initialize({
    startOnLoad: true,
    theme: 'neutral',
    flowchart: { useMaxWidth: true, htmlLabels: true },
    sequence: { useMaxWidth: true }
  });
</script>
</body>
</html>`;

fs.writeFileSync(htmlPath, fullHtml, 'utf8');
console.log('3. HTML estructurado generado en:', htmlPath);

console.log('4. Generando PDF con Microsoft Edge Headless...');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browserExe = fs.existsSync(edgePath) ? edgePath : chromePath;

const cmd = `"${browserExe}" --headless=new --no-sandbox --disable-gpu --run-all-compositor-stages-before-draw --virtual-time-budget=6000 --no-pdf-header-footer --print-to-pdf="${pdfPath}" "file:///${htmlPath.replace(/\\/g, '/')}"`;

execSync(cmd, { stdio: 'inherit' });

if (fs.existsSync(pdfPath)) {
  const stats = fs.statSync(pdfPath);
  console.log(`✓ PDF generado exitosamente: ${pdfPath} (${(stats.size / 1024).toFixed(1)} KB)`);
} else {
  console.error('Error: el PDF no se generó.');
  process.exit(1);
}
