# Plan técnico — PLAN-60

Entrada: `01-spec.md` y el código del backoffice en `main` (`6c361ec`).

## Enfoque

La regla que ordena todo lo demás es una sola:

> En `readonly` se quita la **señal de acción** y se conserva la **información**.

De ahí sale todo lo demás. Quitar la señal de acción significa: nada de caja de control, nada de
`cursor: pointer`, nada de atenuación de navegador, y el `<select>` sin su opción de arranque que
invita a elegir. Conservar la información significa: el chip que estaba seleccionado sigue
seleccionado, el switch que estaba encendido sigue encendido, y los valores siguen siendo
legibles y copiables. Un readonly que "griseara" todo perdería información y además reprobaría
contraste, que es el error que hizo el `--color-text-disabled` de la paleta.

Sobre esa regla se aplica un segundo cambio, independiente: los cuatro valores derivados de
`schema()` pasan de leerse en `ngOnInit` a derivarse con `computed()`, que es lo que el issue pide y
lo que además los hace correctos cuando el esquema cambia con el componente montado.

La pieza que evita duplicar el tratamiento visual cinco veces es un contrato compartido: una
constante de estilo y un nombre de atributo definidos en un módulo nuevo, que los cinco componentes
de campo interpolan en sus `styles` y aplican en su contenedor. El contrato es **texto idéntico**
en los cinco, y eso es lo que un test de auditoría puede verificar leyendo los archivos, con el
mismo patrón que ya usa `src/app/styles/__tests__/typography-guard.spec.ts`.

## Archivos a tocar

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/forms/fields/readonly-contract.ts` | crear | Contrato compartido: atributo `data-readonly` y la constante `READONLY_STYLES` con el tratamiento único |
| `src/app/forms/fields/field-text.component.ts` | modificar | `computed()` para `maxLength`; aplicar el contrato; ocultar asterisco en readonly |
| `src/app/forms/fields/field-number.component.ts` | modificar | `computed()` para `isInteger`; aplicar el contrato; ocultar asterisco en readonly |
| `src/app/forms/fields/field-select.component.ts` | modificar | `computed()` para `enumValues`; aplicar el contrato; sin opción de arranque en readonly, con raya si está vacío |
| `src/app/forms/fields/field-multiselect.component.ts` | modificar | `computed()` para `enumValues`; aplicar el contrato |
| `src/app/forms/fields/field-boolean.component.ts` | modificar | Aplicar el contrato; quitar `cursor: pointer` al switch en readonly |
| `src/app/forms/fields/index.ts` | modificar | Reexportar el contrato para que el test de auditoría lo alcance desde un solo lugar |
| `src/app/pages/expediente/expediente.component.ts` | modificar | `role="group"` y nombre accesible en la sección del formulario, conservando la nota visible |
| `src/app/forms/fields/__tests__/readonly-contract.spec.ts` | crear | Auditoría de los cinco archivos: mismo contrato, contraste, sin `opacity` (criterio 2 y 3) |
| `src/app/forms/fields/__tests__/field-components.spec.ts` | crear | Reactividad del `schema()` y no emisión de `valueChange` en readonly (criterios 1 y 4) |

**Total: 10 archivos de código**, dentro del límite de 12 que fuerza checkpoint.

## Decisiones técnicas

- **El contrato de readonly es un atributo, no una clase CSS** — Se descartó usar una clase
  (`class="field-readonly"`) porque el atributo se puede ausentar del todo cuando el campo es
  editable, y una clase ausente obliga a vigilar que nadie la quite. Con `[attr.data-readonly]`
  ligado a `readonly() ? '' : null`, el atributo sólo existe en readonly y las reglas
  `[data-readonly]` no necesitan condición.

- **El contrato se comparte como constante de TypeScript, no como parcial SCSS** — Se descartó
  `styleUrls` con un `_readonly.scss` compartido porque ningún componente del backoffice usa
  `styleUrls` (los 5 de campo, y los de página, declaran `styles` embebidos). Meter el único
  `styleUrls` del repo para esta tarea rompe la convención y obliga a configurar el preprocessado
  de SCSS en el componente. Como constante, el contrato es además **auditable**: un test puede
  verificar que los cinco archivos referencian el mismo símbolo, cosa imposible con un `import`
  de SCSS resuelto en build.

- **Las reglas del contrato usan selectores de elemento, no de clase** — Se descartó escribir en el
  contrato nombres como `.chip` o `.select-wrapper`, que sólo existen en un componente cada uno,
  porque las cinco copias del contrato quedarían con cuatro bloques de reglas muertas cada una. Con
  selectores de elemento (`input`, `select`, `label`) y de atributo, el mismo texto sirve para los
  cinco sin residuos. Lo que no se pueda expresar de forma genérica (el fondo del `.switch-slider`,
  que es un `span` decorativo) queda como regla específica en `field-boolean`, y así se documenta.

- **El texto atenuado de un control deshabilitado se corrige con `-webkit-text-fill-color`, no
  bajando el `opacity`** — Se descartó `opacity` porque la guardia de
  `typography-guard.spec.ts:184` lo prohíbe sin justificación, y porque bajar la opacidad del
  control entero arrastra también el fondo y el foco. En Blink, el `<select disabled>` se atenúa con
  `-webkit-text-fill-color`, una propiedad a la que la author's `color` no le gana; hay que anularla
  explícitamente. En Firefox y WebKit alcanza con `color`, y por eso se emiten las dos.

- **En readonly el `<select>` sin valor muestra una raya, no una caja vacía** — Se descartó
  simplesmente ocultar la opción de arranque, porque un `<select>` sin ninguna opción se renderiza
  en blanco y eso se lee como un campo roto en lugar de como un valor ausente. La raya distingue
  "vacío" de "con valor" sin inventar texto.

- **El foco visible se conserva en los campos de texto y número** — Se descartó quitar el
  `outline` en readonly junto con la caja. Aunque el control no sea editable, sigue siendo
  focalizable (criterio 4) y quien navega con teclado necesita saber dónde está: quitar el indicador
  de foco rompe WCAG 2.4.7. La caja desaparece; el foco, no.

- **La semántica accesible se agrega en `expediente.component.ts`, no en `dynamic-form.component.ts`**
  — Se descartó poner `role="group"` en el contenedor de `dynamic-form` porque ese archivo lo
  modifica el PR #28 y esta tarea se ramifica desde `main`: tocar dos regiones distintas del mismo
  template agrega una chance de conflicto sin ganar nada. La sección `.form-section` del expediente
  ya hospeda la nota visible, que es exactamente el lugar donde el nombre accesible corresponde.
  Además conserva la nota a la vista, así que el test existente
  `expediente.spec.ts:107` (`toContain('Modo solo lectura')`) sigue en verde sin tocarlo.

- **Los tests de los campos van en archivos nuevos bajo `fields/__tests__/`** — Se descartó ampliar
  `src/app/forms/__tests__/dynamic-form.component.spec.ts` porque el PR #28 lo abre con dos casos de
  PLAN-59; dos PRs editando el mismo archivo se esquivan en el merge. Además esta tarea no toca
  `dynamic-form.component.ts`, así que sus casos no tienen relación con los nuevos.

## Contrato de API

No aplica: el alcance es sólo `backoffice` y no cambia ningún endpoint ni el JSON Schema.

## Supuestos

- `RIESGO` **El plan se apoya en que las custom properties de la paleta están disponibles en el
  scope de los estilos embebidos de cada componente.** Se comprobó que `src/styles.scss` las expone
  en `:root` y que los 5 componentes ya las consumen (`var(--color-surface-muted)`,
  `var(--color-text)`), así que no es una suposición sino una verificación. Si al compilar
  apareciera alguna sin resolver, el plan no cambia: se cae al token equivalente ya en uso.

- **El `<select disabled>` es el único control cuyo texto atenuado no se puede corregir con `color`
  solo.** Se verificó leyendo el comportamiento de Blink, no ejecutando un navegador: si la
  propiedad resultara no ser necesaria en algún motor, la regla es inofensiva; si resultara
  necesaria en uno que no se contempló, el criterio 3 igual se cumple porque se emiten las dos
  propiedades. No invalida el plan.

- **No se espera ningún otro consumidor de `DynamicFormComponent` en modo `readonly`.** Se
  verificó que el único uso es `expediente.component.ts:56`. Si mañana aparece otro, el contrato
  shared hace que se comporte igual sin cambios.

- **El presupuesto de `anyComponentStyle` (8 kB de warning, 12 kB de error) aguanta.** Los estilos
  de los 5 componentes de campo rondan 1 kB cada uno y el contrato agrega del orden de 300 bytes. Si alguno pasara el límite, el build lo señala como warning, no como error.

- **El test de auditoría por archivos es un padrão aceptado en este repo.** No es una suposición
  nueva: `typography-guard.spec.ts` ya lee el árbol de `src/` con `node:fs` y falla por violaciones
  de estilo. Se lo replica en miniatura para el contrato de readonly.

## Cómo se prueba

Además de los gates (`npm run lint`, `npm run build`, `npm test`):

| Criterio | Cómo se comprueba |
|---|---|
| 1 — reactividad | `field-components.spec.ts`: se monta cada componente, se cambia `schema()` con `setInput` sin recrear, y se comprueba que el DOM cambió (opciones del select y del multiselect, `maxlength` del text, `step`/`isInteger` del number) |
| 2 — contrato único | `readonly-contract.spec.ts`: lee los 5 archivos y falla si alguno no aplica `data-readonly` al contenedor o no referencia el símbolo del contrato |
| 3 — contraste | `readonly-contract.spec.ts`: el contrato declara `color` y `background` con tokens de la paleta, no usa `opacity`, y un cálculo de luminancia en el test verifica ≥ 4,5:1 para el par elegido |
| 4 — no editable | `field-components.spec.ts`: `spy` sobre `valueChange` en los 5; en readonly no se emite. Además se asserta que text/number siguen con `readonly` (focalizables) y select/multiselect/boolean con `disabled` |
| 5 — sin acción pendiente | `field-components.spec.ts`: en readonly el `select` no tiene la opción de arranque, no aparece el asterisco, y un valor vacío produce la raya |
| 6 — anuncio accesible | `expediente.spec.ts` (existente, sin modificar) sigue cubriendo la nota visible; se agrega un caso que asserta `role="group"` y el nombre accesible de `.form-section` |
| 7 — gates | `node .agents/scripts/verificar.mjs --tarea PLAN-60` |

## Riesgo de merge con el PR #28

El PR #28 (`PLAN-59`) sigue abierto y **no** está en `main`. Esta tarea se ramifica desde `main`, así
que no incluye su commit. Los archivos que toca #28 son
`docker/nginx.conf`, `src/app/core/__tests__/nginx-guard.spec.ts`,
`src/app/forms/__tests__/dynamic-form.component.spec.ts` y
`src/app/forms/dynamic-form.component.ts`. **Ninguno está en la lista de archivos de esta task**, y
`dynamic-form.component.ts` queda explícitamente fuera de alcance. Los dos PRs no se tocan.

La única consecuencia: hasta que #28 se mergee, `main` no tiene el corte de `onBlur` en readonly, así
que el comportamiento de validación al perder foco difiere entre el `main` actual y el que quedará
mergeado. No afecta ningún criterio de esta tarea, que no prueba validación en blur, y queda
mencionado en el cuerpo del PR.
