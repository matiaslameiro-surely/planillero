# Tareas — PLAN-58

Checklist en orden de dependencia. Backend se implementa y verifica primero; luego frontend consume el contrato emitido.

## backend

- [x] `[backend]` Agregar método `complete()` en la entidad de dominio `Visit.java`.
- [x] `[backend]` Crear DTO `CompleteVisitResponse.java`.
- [x] `[backend]` Implementar servicio `VisitCompleteService.java` con validaciones de asignación, bloqueo pesimista y `@AuditLog`.
- [x] `[backend]` Crear controlador `VisitCompleteController.java` para `POST /api/v1/visits/{id}/complete`.
- [x] `[backend]` Crear prueba de integración `VisitCompleteIntegrationTest.java`.
- [x] `[backend]` Emitir `03-contrato-api.md`.

## frontend *(app móvil)*

- [x] `[frontend]` Leer `03-contrato-api.md` antes de empezar.
- [x] `[frontend]` Agregar llamada `completeVisit` y tipos en `src/api/visits.ts`.
- [x] `[frontend]` Agregar `markCompleted` en `src/agenda/agendaRepository.ts`.
- [x] `[frontend]` Implementar `src/visit/completeVisit.ts` y sus pruebas unitarias en `src/visit/completeVisit.test.ts`.
- [x] `[frontend]` Actualizar `src/components/VisitCard.tsx` con botones para evidencias, formulario y finalización con soporte de temas y accesibilidad.
- [x] `[frontend]` Conectar callbacks en `src/app/agenda.tsx` (navegación a `/evidence/[visitId]`, formulario con fallback a `ACTA_CONSTATACION` y confirmación modal de finalización).
- [x] `[frontend]` Actualizar pruebas unitarias en `src/components/VisitCard.test.tsx`.

## Verificación

- [x] Gates en verde en los repos del alcance (`node .agents/scripts/verificar.mjs --tarea PLAN-58`)
- [x] Revisión independiente sin hallazgos `critical` ni `high` (`node .agents/scripts/revisar.mjs`)
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto
