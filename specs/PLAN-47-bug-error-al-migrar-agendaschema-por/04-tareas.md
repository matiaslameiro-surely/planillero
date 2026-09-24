# Tareas — PLAN-47

## frontend *(app móvil)*

- [x] `[frontend]` Remover sentencias `ALTER TABLE` duplicadas del bloque `version < 2` en `frontend/src/db/agendaSchema.ts`
- [x] `[frontend]` Crear `frontend/src/db/agendaSchema.test.ts` con pruebas de migración incremental desde versiones 0, 1, 2, 3 y 4

## Verificación

- [x] Gates en verde en frontend (`node .agents/scripts/verificar.mjs --tarea PLAN-47`)
- [x] Revisión independiente sin hallazgos `critical` ni `high`
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto
