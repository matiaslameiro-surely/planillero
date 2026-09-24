# Tareas — PLAN-50

## backend

- [x] `[backend]` `@Pattern` en `HeartbeatRequest.networkStatus` con `ONLINE|OFFLINE|UNKNOWN` y mensaje en español
- [x] `[backend]` Test: `WIFI`, `online` y `""` → `400 invalid_request` sin modificar el turno
- [x] `[backend]` Test: los tres valores válidos → `200` y se guardan; ausente → `200` sin cambiar el valor
- [x] `[backend]` Emitir `03-contrato-api.md` con los valores admitidos y el `400`

## Verificación

- [x] Gates en verde en backend (`node .agents/scripts/verificar.mjs --tarea PLAN-50`)
- [ ] Revisión independiente sin hallazgos `critical` ni `high`
- [ ] Cada criterio de aceptación de `01-spec.md` queda cubierto
