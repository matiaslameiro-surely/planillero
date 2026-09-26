# Tareas — PLAN-61

## backend

- [x] `[backend]` `VisitStatus`: nombre en español de cada estado (`label()`), exigido por el constructor
- [x] `[backend]` `PlanningService`, `VisitStartService` y `VisitCompleteService`: el mensaje usa `label()`
- [x] `[backend]` `VisitStatusTest`: nombres esperados, ninguno vacío
- [x] `[backend]` Tests de integración: `$.message` en español en asignar, iniciar y completar

## Verificación

- [x] Gates en verde en los repos del alcance (`node .agents/scripts/verificar.mjs`)
- [x] Revisión independiente sin hallazgos `critical` ni `high`
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto
