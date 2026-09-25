# PLAN-62 — Planificación: al elegir un operador, la grilla oculta las visitas pendientes

## Contexto y problema

Detectado el 25/09 en la prueba E2E del backoffice sobre `main` y reproducido a mano por Federico.

En Planificación, el selector «Operador» cumple dos papeles a la vez: define **a quién** se le asigna
(y de quién es la hoja de ruta del panel lateral) y además **filtra la grilla**. Con un operador
elegido, el backoffice pide `GET /api/v1/visits?operatorId=…&date=…`, y el backend
(`PlanningService.restrictToRouteSheets`, desde PLAN-8) devuelve sólo las visitas que ese operador ya
tiene en su hoja de esa fecha. Las pendientes desaparecen. Sin operador, en cambio, la grilla lista
todo, pero el «Asignar» de cada fila está deshabilitado porque no hay destinatario.

Resultado: el «Asignar» de una visita pendiente **nunca** se puede usar. La única forma de asignar es
marcarla sin operador, elegir el operador (la grilla queda vacía, con la selección invisible) y usar
«Asignar seleccionadas».

Verificado en el código (25/09):
- `planificacion.ts` (`reloadVisits`) manda `operatorId` y `date` cuando hay operador elegido. El
  comentario del código ya reconoce que `date` «sólo devolvería visitas ya asignadas».
- Los tests actuales devuelven siempre las mismas visitas sin mirar los parámetros, y por eso no lo
  detectaron.
- PLAN-65 (Juan) describía el mismo problema y proponía separar el destinatario del filtro. Se cerró
  como duplicada de esta y se toma su propuesta.

## Alcance

**Repos que toca:** `backoffice`

El issue decía «backend y backoffice». No hace falta tocar el backend: `GET /visits` sin
`operatorId` ni `date` ya devuelve todas las visitas de la jurisdicción, que es lo que necesita la
grilla. Cambiar la semántica del filtro del backend rompería el contrato de PLAN-8 sin necesidad.

## Criterios de aceptación

1. El selector «Operador» define sólo el **destinatario** de la asignación y la hoja de ruta del
   panel lateral. **No filtra la grilla**: al elegir o cambiar de operador, o al cambiar la fecha, la
   grilla sigue mostrando las visitas de la jurisdicción, filtradas sólo por Estado y Urgencia.
2. La consulta de visitas no manda `operatorId` ni `date`.
3. Con un operador elegido, el «Asignar» de cada fila está habilitado para las visitas asignables, y
   pasa por la confirmación de PLAN-27 como hoy.
4. Las visitas que ya están en la hoja del operador y la fecha elegidos siguen mostrando «Ya en su
   hoja», con el checkbox deshabilitado (PLAN-42).
5. Las visitas `IN_PROGRESS` pasan a «No asignable», como las `COMPLETED` y `CANCELLED`: el backend
   las rechaza (`visit_not_assignable`) y hoy la grilla ofrecía «Asignar».
6. «Asignar seleccionadas (N)» cuenta y manda lo marcado que se ve en la grilla, sin lo que ya está
   en la hoja vigente.
7. Después de asignar, la grilla se recarga (los estados cambian a «Asignada») y la hoja de ruta del
   panel se actualiza, como hoy.
8. La opción vacía del selector deja de decir «(se listan todas las visitas)», porque ahora la grilla
   siempre las lista.
9. Tests que cubren 1 a 6, entre ellos uno que falle con el código actual (que la consulta no lleve
   `operatorId` ni `date`), y gates en verde.

## Fuera de alcance

- Un filtro explícito «asignadas a…» en la grilla (criterio 4 de PLAN-65, opcional). Si hace falta,
  va en otra tarea.
- Cambios en el backend (`GET /visits`, `restrictToRouteSheets`) y en el mensaje de
  `visit_not_assignable`, que traduce PLAN-61 (Matías).
- Mostrar en la grilla a qué operador está asignada cada visita.

## Preguntas abiertas

- [x] `NO-BLOQUEANTE` — **¿Hace falta un filtro por operador asignado en la grilla?** Se deja fuera:
  la hoja de ruta del panel lateral ya muestra lo del operador elegido para esa fecha.
- [x] `NO-BLOQUEANTE` — **¿Se toca el backend?** No: ver Alcance.
