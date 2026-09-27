# Plan técnico — PLAN-37

## Enfoque

El objetivo es redactar y consolidar el informe final de la entrega (Parte 1, Secciones 1 a 7 y tabla de links obligatoria) en un único documento maestro estructurado en Markdown (`docs/INFORME_FINAL_ENTREGA.md`).

Para lograr un documento riguroso, profesional y fiel al proceso real del proyecto:
1. Se extrae y sintetiza la información de los artefactos existentes del repositorio:
   - Especificaciones y planes de arquitectura de los módulos y contratos (`specs/*/01-spec.md`, `specs/*/02-plan.md`, `03-contrato-api.md`).
   - Resoluciones conceptuales previas (`docs/Resolucion_Practico_App_Planillero.pdf`, `docs/resolucion_planillero_texto.txt`).
   - Auditorías de UX móvil y web (`frontend/docs/AUDITORIA_UX_MOVIL.md`, `backoffice/docs/auditoria-ux-ui.md`).
   - Registros de ciberseguridad (`*/security-log.md`).
   - Registros y scripts de pruebas de recorrido E2E (`frontend/docs/REGISTRO_E2E.md`, `specs/PLAN-34*/plan34-e2e.ps1`).
   - Métricas exactas de co-work agéntico extraídas de `node .agents/scripts/informe.mjs`.
2. Se plasman las cuatro definiciones consensuadas con el usuario:
   - Eje de IA en el co-work agéntico y SDD (módulo de IA en la app Post-MVP por priorización de cátedra).
   - Video demostrativo diferido fuera de esta entrega.
   - Equipo con modalidad de trabajo cruzado e interdisciplinario entre los cuatro alumnos.
   - Formato Markdown maestro preparado para lectura directa y exportación a PDF.

## Archivos a tocar

### harness (raíz)

| Archivo | Acción | Para qué |
|---|---|---|
| `docs/INFORME_FINAL_ENTREGA.md` | crear | Documento consolidado del informe final con tabla de links y Secciones 1 a 7 |

## Decisiones técnicas

- **Documento maestro en Markdown enriquecido (con Mermaid y tablas GFM)** — Se descartó redactar directamente en binario (DOCX/PDF) porque Markdown garantiza trazabilidad en git, versionado limpio, revisión por diffs y compatibilidad universal para exportar a PDF (mediante VSCode Markdown PDF, Pandoc o Typst).
- **Enfoque de IA en Co-work agéntico y ciclo SDD** — Se descartó inventar una funcionalidad de IA dentro de la app móvil para cumplir la consigna; se adoptó la postura honesta y justificada de priorizar el co-work con múltiples IAs como la manifestación principal de IA aplicada a organizaciones, documentando el módulo inteligente de la app (PLAN-21) como evolución Post-MVP.
- **Transparencia en pruebas de usuario de campo (UX)** — Se descartó presentar métricas inventadas de pruebas de campo con operadores reales; se documenta el diseño formal del protocolo de prueba T1-T6 (PLAN-34) como pendiente de despliegue en campo.

## Supuestos

- **`NO-RIESGO`** — Los enlaces a los repositorios GitHub (`https://github.com/matiaslameiro-surely/...`) se harán públicos antes de la corrección formal de los docentes en cumplimiento de PLAN-1.
- **`NO-RIESGO`** — El entorno de producción en `https://planillero.ferchamorro.cloud` mantendrá el backend y el backoffice accesibles con los usuarios sembrados de demo.

## Cómo se prueba

- Inspección y validación del documento `docs/INFORME_FINAL_ENTREGA.md`:
  - Verificación de la presencia de la tabla de links en el encabezado.
  - Verificación de que cubre íntegramente las 7 secciones obligatorias con datos reales.
  - Validación de sintaxis Markdown y bloques de diagramas Mermaid.
  - Ejecución de gates del harness (`node .agents/scripts/verificar.mjs --tarea PLAN-37`).
