# Plan técnico — PLAN-62

## Enfoque

Separar los dos papeles del selector «Operador», sólo en el backoffice:

- `reloadVisits()` deja de mandar `operatorId` y `date`; pide sólo con Estado y Urgencia.
- Cambiar de operador o de fecha recarga **sólo** la hoja de ruta (`reloadRouteSheet`), no la grilla.
- `isSelectable()` suma `IN_PROGRESS` a los estados no asignables.
- Lo de PLAN-42 (`currentSheetIds`, «Ya en su hoja», `assignableSelection`) queda igual y ahora se
  ve en la grilla completa, que es donde tenía sentido.

## Archivos a tocar

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/pages/planificacion/planificacion.ts` | modificar | `reloadVisits` sin `operatorId`/`date`; operador y fecha recargan sólo la hoja; `IN_PROGRESS` no asignable |
| `src/app/pages/planificacion/planificacion.html` | modificar | Texto de la opción vacía del selector y su comentario |
| `src/app/pages/planificacion/planificacion.spec.ts` | modificar | Ajustar el test del filtro y sumar los casos 1 a 6 |

Total: 3 archivos.

## Decisiones técnicas

- **No tocar el backend.** `GET /visits` sin filtros de hoja ya devuelve la jurisdicción. Cambiar
  `restrictToRouteSheets` cambiaría un contrato que nadie más necesita cambiar.
- **Operador y fecha no recargan la grilla.** La grilla ya no depende de ellos. Recargarla sería una
  consulta de más y un parpadeo sin motivo.
- **`IN_PROGRESS` como no asignable en la grilla.** El backend ya la rechaza. Ofrecer «Asignar» sólo
  lleva a un error, y con la grilla completa esas visitas ahora se ven más seguido.

## Supuestos

- `GET /api/v1/visits` sin `operatorId` ni `date` devuelve todas las visitas de la jurisdicción del
  supervisor. Verificado en `PlanningService.listVisits` y con la API local (6 visitas de ZONA_NORTE).
- Reasignar una visita `ASSIGNED` a otro operador es válido: el backend la suelta de la hoja anterior
  (heurística 7), y la confirmación de PLAN-27 ya lo advierte.

## Cómo se prueba

1. Tests en `planificacion.spec.ts`, incluido uno que falla con el código actual.
2. `node .agents/scripts/verificar.mjs --tarea PLAN-62`.
3. En local (Chrome headless y a mano): con `operador.norte2` elegido se ven V-1004 y V-1005 con
   «Asignar» habilitado; asignar una la pasa a «Ya en su hoja».
