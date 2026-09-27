# Tareas — PLAN-77

## backend

- [x] `[backend]` Modificar `SupervisionService.java` para eliminar llamadas a `HtmlUtils.htmlEscape` en `recordHeartbeat` y `getOperatorsStatus` y remover import huérfano.
- [x] `[backend]` Agregar prueba de integración en `SupervisionIntegrationTest.java` para validar el guardado y recuperación de observaciones con acentos, eñes, comillas y etiquetas HTML.

## backoffice *(web)*

- [x] `[backoffice]` Crear helper `escapeHtml` en `src/app/core/utils/escape-html.ts` y sus pruebas en `escape-html.spec.ts`.
- [x] `[backoffice]` Aplicar `escapeHtml` en `supervision-map.ts` para sanitizar datos del popup (`observations`, `username`, `activeVisitCode`, `networkStatus`).
- [x] `[backoffice]` Crear pruebas unitarias en `supervision-map.spec.ts` verificando el renderizado seguro de popups con HTML inyectado.
- [x] `[backoffice]` Aplicar `escapeHtml` en `route-map.ts` y actualizar `route-map.spec.ts`.

## Verificación

- [x] Gates en verde en backend (`node .agents/scripts/verificar.mjs --tarea PLAN-77 --repo backend`)
- [x] Gates en verde en backoffice (`node .agents/scripts/verificar.mjs --tarea PLAN-77 --repo backoffice`)
- [x] Revisión independiente sin hallazgos `critical` ni `high` (`node .agents/scripts/revisar.mjs --tarea PLAN-77 --repo backoffice`)
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto
