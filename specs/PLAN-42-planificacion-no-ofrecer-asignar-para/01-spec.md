# PLAN-42 — Planificación: no ofrecer «Asignar» para visitas que el operador ya tiene en su hoja de ruta de esa fecha

## Contexto y problema

Detectado el 24/09 al recorrer el backoffice en local. En Planificación, después de asignarle una
visita a un operador, el botón «Asignar» de esa visita sigue habilitado. Si se vuelve a asignar al
mismo operador y fecha, el backend lo rechaza (`400 visit_already_assigned`, sin guardar nada
duplicado): aparece el mensaje arriba y queda un error rojo en la consola del navegador.

La pantalla ya tiene el dato para evitarlo: el signal `routeSheet` trae la hoja de ruta del operador y
la fecha elegidos, con su `operatorId`, su `date` y sus visitas.

## Alcance

**Repos que toca:** `backoffice`

## Criterios de aceptación

1. Con un operador y una fecha elegidos, las visitas que ya están en su hoja de ruta de ese día:
   - no tienen el botón «Asignar»: en su lugar dice «Ya en su hoja», con el motivo completo en el
     tooltip;
   - tienen el checkbox de selección deshabilitado, con el mismo motivo.
2. Esas visitas no se incluyen en «Asignar seleccionadas (N)»: si quedaron marcadas antes de elegir
   el operador, no cuentan en N ni se mandan.
3. Si se elige **otro** operador, u otra fecha, en la que esa visita no está, «Asignar» vuelve a
   estar disponible (reasignar sigue funcionando).
4. Mientras carga la hoja de ruta de un operador recién elegido, no se usa la de otro operador o de
   otra fecha para deshabilitar.
5. Tests de Planificación que cubren 1 a 4, y gates del backoffice en verde.

## Fuera de alcance

- Cambiar el 400 del backend por un 409: queda como opcional en el issue, y el mensaje actual sigue
  siendo la red de seguridad si otro supervisor asigna al mismo tiempo.

## Preguntas abiertas

Ninguna.
