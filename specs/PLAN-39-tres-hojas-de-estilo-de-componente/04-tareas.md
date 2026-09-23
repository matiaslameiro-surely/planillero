# Tareas — PLAN-39

## backoffice *(web)*

- [x] `[backoffice]` Crear rama `PLAN-39-tres-hojas-de-estilo-de-componente` en `backoffice`
- [x] `[backoffice]` Crear `src/app/styles/_modal.scss` con las clases base del patrón de modal compartido
- [x] `[backoffice]` Importar `_modal.scss` en `src/styles.scss`
- [x] `[backoffice]` Refactorizar `evidence-viewer` (`.html` y `.scss`) para adoptar la base de modal compartida
- [x] `[backoffice]` Refactorizar `planificacion` (`.html` y `.scss`) para adoptar la base de modal compartida
- [x] `[backoffice]` Actualizar presupuestos `anyComponentStyle` y agregar comentario justificativo en `angular.json`
- [x] `[backoffice]` Comprobar que `npm run build` no emita advertencias de presupuesto

## Verificación

- [x] Gates en verde en los repos del alcance (`node .agents/scripts/verificar.mjs`)
- [x] Revisión independiente sin hallazgos `critical` ni `high`
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto
