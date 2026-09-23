# Plan técnico — PLAN-23

## Enfoque

Tres ediciones puntuales en tres archivos del backoffice, sin refactor de por medio. La decisión que
ordena el resto es **no tocar los sitios de uso del color**: `$color-primary` ya está centralizado en
`_variables.scss` y los 15 usos en los `.scss` de las páginas lo consumen por token, así que cambiar
el valor del token alcanza para corregir el contraste en todos lados a la vez. No hay `darken()`,
`lighten()` ni `color.adjust()` derivando otros colores de él, con lo cual no hay efectos en cadena
que revisar.

El valor adoptado es **`#1268bd`**, verificado con la fórmula de WCAG 2.1 (luminancia relativa con
linealización sRGB): **5,61:1 sobre blanco**, contra los 3,53:1 del actual `#208aef`. Supera el 4,5:1
de AA con margen y mantiene el matiz azul, así que no hay cambio de identidad visual.

## Archivos a tocar

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/styles/_variables.scss` | modificar | `$color-primary: #208aef` → `#1268bd` (H27) |
| `src/index.html` | modificar | `<html lang="en">` → `<html lang="es">` (H9) |
| `src/app/pages/planificacion/planificacion.html` | modificar | Acentuar los encabezados de la grilla (H10) |

Total: **3 archivos**. Muy por debajo del límite de 12 de `workspace.json`.

## Decisiones técnicas

- **Cambiar el valor del token en vez de agregar un token nuevo** (`$color-primary-accessible` o
  similar). Se descartó agregar uno porque dejaría los dos conviviendo y habría que migrar los 15
  usos uno por uno, con el riesgo de que alguno quede en el color viejo; el token existente ya es el
  único punto de verdad.
- **`#1268bd` como valor.** Se descartó buscar otro candidato «más lindo» a ojo porque el criterio de
  aceptación exige verificar el ratio con la fórmula, y este ya está verificado y conserva el matiz.
  Se descartó también oscurecerlo más (por ejemplo `#0d4f91`, ~7,9:1, que cumpliría AAA) porque
  alejarse tanto del original cambia la identidad visual, y la tarea es corregir accesibilidad, no
  rediseñar.
- **No exponer el token como custom property CSS.** Se descartó hacerlo de paso porque es
  explícitamente el alcance de PLAN-28, que está asignada a otra persona en el mismo sprint: hacerlo
  acá le genera un conflicto de merge.
- **Corregir también «Accion» (`planificacion.html:80`)**, además de las tres líneas que lista el
  issue. Se descartó dejarlo porque es el mismo defecto en la misma tabla y abrir un issue aparte
  para una tilde cuesta más que la corrección. Queda como pregunta abierta `NO-BLOQUEANTE` en la spec
  y se menciona en el cuerpo del PR, para que la revisión humana pueda discrepar.

## Contrato de API

No aplica: el alcance es un solo repo cliente y no se toca ningún endpoint.

## Supuestos

- Los 15 usos de `$color-primary` en los `.scss` de las páginas usan el token y no el literal
  `#208aef`. **Verificado**: `grep -rn "208aef" src/` sólo devuelve la línea de `_variables.scss`.
- Ningún test ni snapshot afirma sobre el valor literal del color ni sobre los textos sin acento.
  **Verificado**: el grep de «Codigo», «Direccion», «Sincronizacion» y «208aef` sobre `src/` no
  devuelve nada en archivos `.ts`.
- `planificacion.html` está codificado en UTF-8, con lo cual escribir las tildes no rompe nada. El
  resto del mismo archivo ya tiene texto acentuado («Sincronización…» y otros), así que la
  codificación está resuelta.
- Ninguna otra tarea del sprint activo toca estos tres archivos antes de que este PR se mergee.
  PLAN-28 (tokens de diseño) **sí toca `_variables.scss`**, así que va a haber que resolver un
  conflicto en alguno de los dos PRs. No es `RIESGO` para este plan: el cambio de acá es una línea y
  se rebasa trivialmente.

Ninguno marcado `RIESGO`.

## Cómo se prueba

- **Criterio 1 y 2** — se recalcula el ratio del valor adoptado con la fórmula de WCAG 2.1 y se deja
  la salida del cálculo en el commit / cuerpo del PR. Verificado: 5,61:1.
- **Criterio 3** — `grep 'lang=' src/index.html` devuelve `es`.
- **Criterio 4** — `grep -n 'Código\|Dirección\|Sincronización' planificacion.html` devuelve las tres
  líneas y `grep -n 'Codigo\|Direccion\|Sincronizacion'` no devuelve nada.
- **Criterio 5** — `node .agents/scripts/verificar.mjs --tarea PLAN-23`, que corre `npm run lint`,
  `npm run build` (que valida los templates, no sólo los tipos) y `npm test`.
