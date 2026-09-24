# Plan técnico — PLAN-42

## Enfoque

Un `computed` con los IDs de las visitas de la hoja de ruta **vigente**, es decir la que coincide con
el operador y la fecha elegidos (`sheet.operatorId === selectedOperatorId()` y
`sheet.date === selectedDate()`). Con eso:

- `isInCurrentSheet(visit)` decide si la fila muestra «Ya en su hoja» en lugar del botón y deshabilita
  el checkbox;
- la selección que se manda y el N del botón en bloque excluyen esas visitas.

## Archivos a tocar

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/pages/planificacion/planificacion.ts` | modificar | `currentSheetIds` (computed), `isInCurrentSheet()`, selección efectiva sin esas visitas |
| `src/app/pages/planificacion/planificacion.html` | modificar | Checkbox deshabilitado con tooltip y «Ya en su hoja» en lugar de «Asignar» |
| `src/app/pages/planificacion/planificacion.spec.ts` | modificar | Casos de los criterios 1 a 4 |

## Decisiones técnicas

- **Comparar operador y fecha de la hoja con la cabecera, en lugar de vaciar `routeSheet` al recargar.**
  Vaciarla haría parpadear la hoja y el mapa en cada cambio. Comparando, una hoja vieja
  simplemente no cuenta.
- **Excluir en un `computed` de selección efectiva, en lugar de podar `selected` con un `effect`.** Si el
  supervisor cambia de operador, lo que marcó vuelve a contar sin tener que volver a marcarlo, y no
  hay escrituras desde un `effect`.

## Supuestos

- `RouteSheet.date` viene en el mismo formato que `selectedDate()` (`YYYY-MM-DD`). Verificado en el
  modelo y en el servicio.

## Cómo se prueba

1. Tests nuevos en `planificacion.spec.ts`.
2. `node .agents/scripts/verificar.mjs --tarea PLAN-42`.
3. En local: asignar una visita y ver que su fila pasa a «Ya en su hoja».
