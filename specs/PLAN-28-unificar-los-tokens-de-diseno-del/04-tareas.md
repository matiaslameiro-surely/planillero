# Tareas — PLAN-28

## backoffice

- [x] `[backoffice]` Ampliar `src/app/styles/_variables.scss` con la escala completa (texto, superficie, borde, estados) y sus ratios de contraste
- [x] `[backoffice]` Emitir el bloque `:root { --color-* }` en `src/styles.scss` con toda la escala
- [x] `[backoffice]` Migrar `src/styles.scss`: pills, badges y audit a `var()`
- [x] `[backoffice]` Migrar `navbar.scss` a la escala
- [x] `[backoffice]` Migrar `home.scss` a la escala
- [x] `[backoffice]` Migrar `login.scss` a la escala
- [x] `[backoffice]` Migrar `auditoria.scss` a la escala
- [x] `[backoffice]` Migrar `planificacion.scss` a la escala
- [x] `[backoffice]` Migrar `route-map.scss` a la escala
- [x] `[backoffice]` Migrar `supervision.scss` a la escala
- [x] `[backoffice]` Migrar `supervision-map.scss` a la escala
- [x] `[backoffice]` Migrar `evidence-viewer.scss` a la escala
- [x] `[backoffice]` Migrar `access-denied.scss` a la escala
- [x] `[backoffice]` Migrar estilos embebidos de `expediente.component.ts` a `var()`
- [x] `[backoffice]` Migrar estilos embebidos de `dynamic-form.component.ts` a `var()`
- [x] `[backoffice]` Migrar estilos embebidos de `field-text.component.ts` a `var()`
- [x] `[backoffice]` Migrar estilos embebidos de `field-number.component.ts` a `var()`
- [x] `[backoffice]` Migrar estilos embebidos de `field-select.component.ts` a `var()`
- [x] `[backoffice]` Migrar estilos embebidos de `field-boolean.component.ts` a `var()`
- [x] `[backoffice]` Migrar estilos embebidos de `field-multiselect.component.ts` a `var()`
- [x] `[backoffice]` Verificar cero hex literales en `src/` (excluyendo `_variables.scss` y Leaflet)
- [x] `[backoffice]` Auditar con script de contraste todos los pares `fg`/`bg` en uso y documentar la tabla en el PR

## Verificación

- [x] Gates en verde en los repos del alcance (`node .agents/scripts/verificar.mjs`)
- [x] Revisión independiente sin hallazgos `critical` ni `high` (nivel `low` atendido en el mismo PR)
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto