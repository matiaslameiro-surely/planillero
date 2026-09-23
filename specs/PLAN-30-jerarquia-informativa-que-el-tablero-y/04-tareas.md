# Tareas — PLAN-30

Checklist de tareas en orden de ejecución.

## backoffice *(web)*

- [x] `[backoffice]` Implementar frescura relativa («actualizado hace...», cuenta regresiva) y detección de datos obsoletos (`isStale`) en `supervision.ts`, `supervision.html` y `supervision.scss` (H1, H2).
- [x] `[backoffice]` Desacoplar estado de carga y valor de jurisdicción en `supervision.html` (H5).
- [x] `[backoffice]` Reorganizar jerarquía de KPIs (foco en excepciones accionables: Fuera de SLA / Demorados) y compactar cabecera para ganar espacio vertical por encima del área operativa (H23, H26).
- [x] `[backoffice]` En `evidence-viewer.html` y `evidence-viewer.scss`, evitar píldora «PENDIENTE DE SELLADO» durante la carga (H4) y colocar el veredicto pericial en primer plano antes de firmas y detalles técnicos (H24).
- [x] `[backoffice]` Agregar expiración automática (6 segundos) al aviso de éxito de asignación en `planificacion.ts` (H3).
- [x] `[backoffice]` Remover la exposición de la URL de la API técnica en `home.html` (H25).
- [x] `[backoffice]` Implementar layout elástico de 2 columnas para pantallas de escritorio en `expediente.component.ts` (H34) y añadir media queries `min-width` para monitores grandes (H36).
- [x] `[backoffice]` Actualizar y agregar pruebas unitarias en `supervision.spec.ts` y `planificacion.spec.ts`.

## Verificación

- [x] Gates en verde en backoffice (`node .agents/scripts/verificar.mjs --tarea PLAN-30`)
- [x] Revisión independiente sin hallazgos `critical` ni `high` (`node .agents/scripts/revisar.mjs --tarea PLAN-30 --repo backoffice`)
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto
