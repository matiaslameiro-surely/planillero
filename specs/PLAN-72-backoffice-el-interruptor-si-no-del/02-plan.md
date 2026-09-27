# Plan técnico — PLAN-72

## Enfoque

Vincular el checkbox con el texto que ya está en pantalla, sin cambiar la maqueta:
`aria-labelledby` apunta al `span.field-label` (con un id propio) y `aria-describedby` a la
descripción cuando existe. El asterisco de obligatorio se marca `aria-hidden="true"` para que no
forme parte del nombre, y la obligatoriedad se informa con `aria-required`.

## Archivos a tocar

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/forms/fields/field-boolean.component.ts` | modificar | ids del texto y la descripción; `aria-labelledby`, `aria-describedby`, `aria-required`; asterisco oculto al lector |
| `src/app/forms/fields/__tests__/field-components.spec.ts` | modificar | Test del nombre, la descripción y la obligatoriedad accesibles |

## Decisiones técnicas

- **`aria-labelledby` al texto existente.** Se descartó mover el texto dentro del `<label>`: cambia la
  maqueta y el layout (texto a la izquierda, interruptor a la derecha, con la descripción en el
  medio). Con `aria-labelledby` el resultado para el lector es el mismo sin tocar el diseño.
- **Asterisco con `aria-hidden` + `aria-required`.** Se descartó dejarlo en el nombre («Conforme *»):
  el lector lee «asterisco», que no dice nada; `aria-required` es la forma estándar.
- **Ids derivados del id que ya genera el componente** (`field-boolean-xxxx-label`,
  `…-description`), para que sean únicos con varios interruptores en el mismo formulario.

## Supuestos

- La prueba con axe-core se repite con el mismo script del 27/09 (`a11y.js`), contra el backoffice
  local reconstruido con la rama.
- No hay supuestos `RIESGO`.
