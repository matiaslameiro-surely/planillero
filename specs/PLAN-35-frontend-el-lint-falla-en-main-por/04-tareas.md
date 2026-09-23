# Tareas — PLAN-35

## frontend *(app móvil)*

- [x] `[frontend]` `package.json`: agregar `--no-cache` al script `lint`
- [x] `[frontend]` `README.md`: explicar por qué el lint corre sin caché

## Verificación

- [x] Gates en verde en frontend (`node .agents/scripts/verificar.mjs --tarea PLAN-35`)
- [x] Prueba con caché envenenada: el script viejo falla y el nuevo pasa
- [x] Revisión independiente sin hallazgos `critical` ni `high`
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto
