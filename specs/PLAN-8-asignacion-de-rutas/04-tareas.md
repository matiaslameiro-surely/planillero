# Tareas — PLAN-8

> Checklist en orden de dependencia. Todo lo de `[backend]` va antes que lo de `[backoffice]`: el
> contrato de API se define en el backend y el cliente lo consume. Marcá `[x]` a medida que se
> completan.

## backend

- [x] `[backend]` Rama `PLAN-8-asignacion-de-rutas` desde `main` (backend y backoffice)
- [x] `[backend]` Migración `V4__route_scheduling.sql`: esquema `visits` (tablas `visits` y
      `route_sheets` con índices y unicidades), `core.users.jurisdiction` y seed ficticio
- [x] `[backend]` `User.jurisdiction` + `UserRepository.findByRoles_Name`
- [x] `[backend]` Enums, entidades y repos de `planning` (`Visit`, `VisitStatus`, `VisitUrgency`,
      `RouteSheet`, repos)
- [x] `[backend]` DTOs de `planning` (`OperatorDto`, `VisitDto`, `RouteSheetDto`, `AssignRequest`)
- [x] `[backend]` `PlanningService` (jurisdicción, orden por urgencia, asignación/reasignación) y
      `PlanningController` con los 4 endpoints
- [x] `[backend]` Emitir `03-contrato-api.md` *(obligatorio: el alcance incluye backoffice)*
- [x] `[backend]` `PlanningIntegrationTest` (401/403, orden, reasignación, acceso horizontal, 400/404)
      — además, surefire corre por clase en fork propio (se eliminó un fallo de suite completa)

## backoffice *(web)*

- [x] `[backoffice]` Leer `03-contrato-api.md` antes de empezar
- [x] `[backoffice]` Agregar `leaflet` (+ `@types/leaflet`) e importar su CSS en `styles.scss`
      (loader `.png` en `angular.json` para los assets del marcador por defecto)
- [x] `[backoffice]` Tipos `planificacion.model.ts` + `planificacion.service.ts` + tests
- [x] `[backoffice]` `supervisorGuard` (sesión + rol SUPERVISOR) + tests + ruta `/planificacion` y
      acceso desde el home (solo supervisores); pantalla `access-denied` para rol insuficiente
- [x] `[backoffice]` Componente `route-map` (Leaflet aislado, mockeado en tests) + CSS
- [x] `[backoffice]` Página `planificacion`: fecha, filtros, grilla reactiva propia, asignación y
      reasignación rápida + tests

## Verificación

- [x] Gates en verde en los dos repos (`node .agents/scripts/verificar.mjs --tarea PLAN-8`)
- [x] Revisión independiente sin hallazgos `critical` ni `high` (backend y backoffice `approve`)
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto