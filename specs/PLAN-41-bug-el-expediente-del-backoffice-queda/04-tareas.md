# Tareas — PLAN-41

## backoffice *(web)*

- [x] `[backoffice]` Spec del expediente (carga, error, formulario y sin ID) y confirmar que falla con el código actual
- [x] `[backoffice]` Pasar el estado del expediente a signals y actualizar el template

## Verificación

- [x] Spec en verde con el arreglo
- [x] Gates en verde (`node .agents/scripts/verificar.mjs --tarea PLAN-41`)
- [x] Prueba en el entorno local: el expediente carga
- [x] Revisión sin hallazgos `critical` ni `high`
