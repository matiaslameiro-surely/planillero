# PLAN-27 — Pedir confirmación antes de asignar trabajo a un operador, y no preseleccionar el destinatario

## Contexto y problema

Asignar visitas es la única acción del backoffice que tiene consecuencias sobre el trabajo real de una
persona: define la jornada de un operador en la calle. Hoy es, además, la acción con menos fricción de
toda la aplicación. La auditoría UX/UI de PLAN-18 lo registró como hallazgo H12.

Tres decisiones que por separado serían menores se combinan en un riesgo concreto. Al cargar la
pantalla de planificación, si no hay operador elegido se autoselecciona el primero de la lista
(`planificacion.ts`, `loadOperators()`), así que el desplegable **nunca** está vacío y siempre parece
que el supervisor eligió a alguien. Tanto «Asignar seleccionadas (N)» como la acción rápida de cada
fila llaman a `assign()` directo, sin confirmación ni paso intermedio. Y no existe ninguna operación
de deshacer: el acuse informa un hecho ya consumado. El resultado es que un clic puede volcar la
jornada completa de un operador sobre una persona que el supervisor nunca eligió conscientemente.

La tarea arrastra dos hallazgos relacionados de la misma auditoría. **H13**: el campo de fecha de la
planificación no tiene `min` ni validación posterior, así que se puede asignar una hoja de ruta a una
fecha ya transcurrida —casi siempre un error de tipeo—, en contraste con los filtros de auditoría, que
sí se acotan entre sí con `min`/`max`. **H15**: en el visor de evidencias el `(keydown.escape)` está
puesto sobre el `<div role="dialog">`, un elemento sin `tabindex` al que nadie le da foco al abrirse;
como el modal se abre desde una tarjeta que queda detrás, lo habitual es que Escape no haga nada, y
tampoco hay trampa de foco ni retorno de foco al cerrar.

## Alcance

**Repos que toca:** `backoffice`

No toca el backend: el endpoint de asignación ya existe y no cambia su contrato. Tampoco toca el
frontend móvil, que no asigna trabajo.

## Criterios de aceptación

1. Al asignar visitas —tanto con «Asignar seleccionadas (N)» como con la acción rápida de una fila— se
   muestra una confirmación previa que nombra **el operador destino, la fecha y la cantidad de
   visitas**. La llamada al backend sólo ocurre si el supervisor confirma; si cancela, no se envía
   nada y la selección queda intacta.
2. El desplegable de operador **no viene preseleccionado**: arranca sin operador elegido, con un texto
   explícito de que hay que elegir uno. Mientras no haya operador elegido, el botón de asignar en
   bloque y el de cada fila están deshabilitados.
3. El campo de fecha de la planificación tiene `min` en el día de hoy y, si aun así llega una fecha
   pasada, la confirmación del criterio 1 incluye una advertencia explícita de que la fecha ya
   transcurrió. No se asigna a una fecha pasada sin que el supervisor haya leído esa advertencia.
4. El modal del visor de evidencias recibe el foco al abrirse, se cierra con Escape desde cualquier
   punto de su contenido, mantiene el foco dentro mientras está abierto y lo devuelve al elemento que
   lo abrió al cerrarse.
5. Los gates del backoffice (`lint`, `build`, `test`) quedan en verde, y hay tests automatizados que
   cubren los criterios 1, 2 y 4.

## Fuera de alcance

- Implementar una operación de **deshacer** la asignación. El issue la menciona como agravante del
  riesgo, no la pide: la confirmación previa es la mitigación acordada. Deshacer requiere endpoint
  nuevo en el backend.
- Revisar el resto de los hallazgos de la auditoría PLAN-18 que no sean H12, H13 y H15.
- Cambiar el contrato de la API de asignación o cualquier código del backend.
- Rediseñar la pantalla de planificación más allá de lo que exigen los criterios.
- Renombrar a inglés el código en español anterior a la convención que no se toque por esta tarea.

## Preguntas abiertas

- [ ] `NO-BLOQUEANTE` El valor vacío del desplegable de operador hoy significa «Todos» y también actúa
      como filtro de la grilla (sin operador, se listan las visitas de toda la jurisdicción). Al sacar
      la preselección, ese valor vacío pasa a ser además «todavía no elegí destinatario». Se resuelve
      en el plan manteniendo el doble sentido y dejándolo explícito en la etiqueta, sin inventar un
      estado nuevo.
- [ ] `NO-BLOQUEANTE` La fecha de hoy se calcula con el reloj local del supervisor (`todayIso()`). Un
      desfasaje de huso horario respecto del backend podría hacer que el `min` corte un día de más o
      de menos. Se mantiene el criterio local, que es el que ya usa el resto de la pantalla.
