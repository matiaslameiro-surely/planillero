# PLAN-72 — Backoffice: el interruptor sí/no del formulario no tiene nombre accesible

## Contexto y problema

Detectado el 27/09 con axe-core (WCAG 2.1 A/AA) en el expediente con formulario: violación **crítica**
de la regla `label` (WCAG 1.3.1 y 4.1.2). Es la única violación en las 10 pantallas analizadas.

Verificado en el código (`src/app/forms/fields/field-boolean.component.ts`): el `<label>` que envuelve
el checkbox sólo contiene el interruptor decorativo, y el texto del campo («Requiere seguimiento») está
en un `span.field-label` sin relación con el control. Un lector de pantalla anuncia «casilla» sin
nombre. Los demás campos (texto, número, select) ya usan `<label for>` con el texto.

## Alcance

**Repos que toca:** `backoffice`

## Criterios de aceptación

1. El checkbox del interruptor tiene como nombre accesible el texto del campo (por ejemplo
   «Requiere seguimiento»), sin el asterisco de obligatorio.
2. Si el campo tiene descripción, queda asociada al checkbox como descripción accesible.
3. Si el campo es obligatorio y editable, el checkbox lo informa (`aria-required`).
4. axe-core no reporta violaciones en el expediente con formulario.
5. Test que verifica el nombre y la descripción accesibles del interruptor.
6. Gates del backoffice en verde.

## Fuera de alcance

- Cambiar el rol del control a `switch` u otras mejoras de semántica.
- El grupo de casillas del multiselect (cada opción ya tiene nombre; axe no lo marca).
- Cambios visuales: el interruptor se ve igual.

## Preguntas abiertas

Ninguna.
