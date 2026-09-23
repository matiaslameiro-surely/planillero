# Tareas — PLAN-29

## backoffice *(web)*

- [x] `[backoffice]` `core/display/labels.ts`: mapas de etiquetas y `labelFor()`
- [x] `[backoffice]` `core/display/display.pipes.ts`: pipes `label`, `shortId` y `appDate`
- [x] `[backoffice]` `core/display/display.spec.ts`: tests de la capa
- [x] `[backoffice]` Modelos: `IN_PROGRESS` en `VisitStatus` y `PENDING` en `verificationStatus`
- [x] `[backoffice]` Planificación: grilla, hoja de ruta y tooltip de sincronización
- [x] `[backoffice]` Expediente: cabecera, ficha y fechas
- [x] `[backoffice]` Evidencias: título con código, estado, tipo, hashes y fechas
- [x] `[backoffice]` Auditoría: fecha, entidad, evento sin código crudo y filtro; actualizar su spec
- [x] `[backoffice]` Supervisión: reemplazar el `@switch` por el pipe

## Verificación

- [x] Gates en verde en backoffice (`node .agents/scripts/verificar.mjs --tarea PLAN-29`)
- [x] La búsqueda de interpolaciones crudas en los templates no da resultados
- [x] Revisión independiente sin hallazgos `critical` ni `high`
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto
