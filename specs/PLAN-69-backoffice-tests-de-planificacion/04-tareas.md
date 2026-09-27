# Tareas — PLAN-69

## backoffice *(web)*

- [x] `[backoffice]` Definir función helper `todayIso()` en `src/app/pages/planificacion/planificacion.spec.ts`
- [x] `[backoffice]` Inicializar `hoja` y `hojaVacia` en `beforeEach` usando `todayIso()`
- [x] `[backoffice]` Agregar caso de prueba reproducible con `vi.setSystemTime` en horario 21:00-24:00 (diferencia entre hora local y UTC)
- [x] `[backoffice]` Ejecutar suite de pruebas de planificación y validar que pasa en verde

## Verificación

- [x] Gates en verde en los repos del alcance (`node .agents/scripts/verificar.mjs --tarea PLAN-69`)
- [x] Revisión independiente sin hallazgos `critical` ni `high`
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto
