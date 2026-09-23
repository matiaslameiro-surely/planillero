# Tareas — PLAN-27

## backoffice *(web)*

No hay tareas de `backend` ni de `frontend`: el alcance es un solo repo y no hay contrato de API que
emitir ni consumir.

- [x] `[backoffice]` Crear la directiva `appFocusTrap` en `shared/directives/focus-trap.ts`: foco al
      elemento al inicializarse, ciclo de Tab acotado al contenedor, evento `escape` y retorno del
      foco al elemento previamente activo cuando se destruye.
- [x] `[backoffice]` Tests de la directiva en `shared/directives/__tests__/focus-trap.spec.ts`.
- [x] `[backoffice]` En `planificacion.ts`: quitar la autoselección de `operators[0]` en
      `loadOperators()`.
- [x] `[backoffice]` En `planificacion.ts`: señal `pendingAssignment` con operador, fecha y visitas;
      `assignSelected()` y `assignSingle()` la llenan en vez de asignar; `confirmAssignment()` y
      `cancelAssignment()`; `minDate` y el indicador de fecha pasada.
- [x] `[backoffice]` En `planificacion.html`: etiqueta «Elegí un operador» en la opción vacía, `[min]`
      en el input de fecha y el panel de confirmación con `appFocusTrap`, que nombra operador, fecha y
      cantidad, y muestra la advertencia si la fecha ya pasó.
- [x] `[backoffice]` Estilos del panel de confirmación en `planificacion.scss`.
- [x] `[backoffice]` Actualizar `planificacion.spec.ts`: corregir los tests que asumían preselección y
      sumar los de confirmación, cancelación, acción rápida y fecha pasada.
- [x] `[backoffice]` Aplicar `appFocusTrap` al modal de `evidence-viewer.html` y colgar de ahí el
      Escape; crear `evidence-viewer.spec.ts` con foco inicial, cierre con Escape y retorno de foco.

## Verificación

- [x] Gates en verde en `backoffice` (`node .agents/scripts/verificar.mjs --tarea PLAN-27`)
- [x] Revisión independiente sin hallazgos `critical` ni `high`
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto
