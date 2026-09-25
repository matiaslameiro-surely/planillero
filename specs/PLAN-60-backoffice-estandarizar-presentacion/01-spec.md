# PLAN-60 — Backoffice: Estandarizar presentación readonly y reactividad de enums en formulario dinámico

## Contexto y problema

El expediente digital (`src/app/pages/expediente/expediente.component.ts:56`) es el único lugar de la
aplicación que renderiza el formulario dinámico con `mode="readonly"`. Es, por definición, un
**registro histórico inmutable**: la visita ya se envió y lo que se muestra es lo que el operador
reportó en el momento.

Ese registro se presenta hoy con dos lenguajes visuales distintos según el tipo de control:

| Componente | Atributo | Consecuencia para quien lee |
|---|---|---|
| `field-text` (`field-text.component.ts:24`) | `[readonly]` | Recibe foco, muestra cursor, se puede seleccionar y copiar |
| `field-number` (`field-number.component.ts:24`) | `[readonly]` | Ídem |
| `field-select` (`field-select.component.ts:24`) | `[disabled]` | Sin foco, texto atenuado por el navegador |
| `field-multiselect` (`field-multiselect.component.ts:27`) | `[disabled]` | Checkboxes grises, sin foco |
| `field-boolean` (`field-boolean.component.ts:30`) | `[disabled]` | Switch gris, sin foco |

La mezcla no es un error de tipeo: HTML no define `readonly` para `<select>` ni para
`<input type="checkbox">`, así que la disparidad de atributos es forzosa. Lo que **no** es forzoso
es que la *presentación* sea igual en los cinco casos. Hoy no lo es: los `input` de texto ya reciben
un fondo gris de solo lectura (`.field-input:read-only`, `field-text.component.ts:46` y
`field-number.component.ts:48`, corregido en PLAN-24), mientras que el `<select>` mantiene su caja con
borde y su texto atenuado por el estilo de navegador, y los chips del multiselect conservan el
`cursor: pointer` y el relleno deprimido de los seleccionables.

El resultado es que el expediente no comunica con claridad si es editable o es un registro, que es
justo lo que el issue quiere resolver.

Hay un segundo problema, independiente del visual. En `field-select.component.ts:68-70` y
`field-multiselect.component.ts:76-79` las opciones del `enum` se leen **una sola vez**, en
`ngOnInit`:

```ts
ngOnInit() {
  this.enumValues = (this.schema()['enum'] as string[]) ?? [];
}
```

`schema()` es un signal de entrada. Si el esquema cambia con el componente ya montado, la lista de
opciones queda desactualizada para siempre. El mismo patrón aparece, sin que el issue los nombre, en
`field-text.component.ts:66-68` (`maxLength`) y `field-number.component.ts:68-70` (`isInteger`): los
cuatro leen `schema()` en `ngOnInit` en lugar de derivarlo reactivamente.

## Alcance

**Repos que toca:** `backoffice` (Angular).

No toca `backend` ni `frontend`: es un cambio de presentación y de reactividad dentro del formulario
dinámico del backoffice. No hay contrato de API que cambiar.

## Criterios de aceptación

1. **Los cuatro valores derivados de `schema()` se calculan reactivamente.** `enumValues` en
   `field-select` y `field-multiselect`, `maxLength` en `field-text` e `isInteger` en `field-number`
   se derivan con `computed()` y no se leen en `ngOnInit`. Verificable: un test que monta cada
   componente, cambia el input `schema` con `setInput` **sin recrear el componente** y comprueba que
   el DOM refleja el esquema nuevo (opciones, `maxlength`, `step`).

2. **Los cinco controles comparten un único contrato de presentación en modo `readonly`.** Todos
   exponen el mismo estado (una clase o atributo compartido aplicado al contenedor del campo) y
   declaran el mismo tratamiento: mismo fondo, mismo color de texto, mismo `cursor` y ninguna caja
   de control editable. Verificable con un test que recorra los cinco componentes y falle si alguno
   no declara el contrato, siguiendo el patrón de auditoría de archivos que ya usa
   `src/app/styles/__tests__/typography-guard.spec.ts`.

3. **El texto de los controles en `readonly` mantiene contraste AA.** Mínimo 4,5:1 sobre su propio
   fondo, y sin atenuar con `opacity` (que la guardia de `typography-guard.spec.ts` prohíbe salvo
   justificación). Cifras medidas para la paleta elegida: `#111827` sobre `#f8fafc` da **16,96:1**;
   `#475569` sobre `#f8fafc` da **7,24:1**. El texto de un `<select disabled>` debe dejar de
   atenuarse solo: hay que anular explícitamente el `-webkit-text-fill-color` que el navegador
   aplica, porque en Blink gana sobre `color` y no se puede corregir desde el autor con la sola
   propiedad `color`.

4. **El registro no se puede alterar y sigue siendo legible.** En `readonly` ningún control emite
   `valueChange` (probado con un `spy` sobre la salida en los cinco componentes), y los de texto y
   número **conservan** `readonly`, no `disabled`: siguen siendo focalizables por teclado y
   seleccionables para copiar, que es lo que un supervisor necesita de un registro histórico.
   `select`, `multiselect` y `boolean` conservan `disabled`, que es lo único que el estándar ofrece
   para ellos.

5. **En `readonly` no se insinúa una acción pendiente.** El `<select>` no renderiza su opción
   vacía de arranque ("Seleccionar...") y el asterisco de campo requerido no se muestra. Cuando el
   valor está vacío, el estado vacío se representa con una raya para que la caja no quede en blanco
   sin explicación. En modo `edit` no cambia nada.

6. **La región del formulario se anuncia como solo lectura.** La sección que ya muestra la nota
   visible "Modo solo lectura - Expediente digital" (`expediente.component.ts:50-52`) se expone
   además como un grupo con nombre accesible, porque un `div` suelto no lo anuncia un lector de
   pantalla. La nota visible se conserva: informa a quien ve, y el nombre accesible informa a quien
   usa tecnología de asistencia. Los atributos nativos `readonly` y `disabled` ya comunican el estado
   de cada control, por lo que no se agregan `aria-readonly` por control: serían redundantes.

7. **Los gates del backoffice quedan en verde:** `npm run lint`, `npm run build` (que valida tipos y
   templates) y `npm test`.

## Fuera de alcance

- **El contrato de API y el backend.** No cambia ningún endpoint ni el JSON Schema que la plantilla
  declara.
- **Cambiar el modo `edit`.** Todo lo de presentación, placeholder y asterisco aplica solo a
  `readonly`; el formulario editable tiene que seguir mostrando la opción de arranque, el asterisco
  de requerido y sus cajas con borde.
- **Que los `<select>` y checkboxes sean editables en `readonly`.** Revertir el criterio 4 en el
  sentido de hacerlos interactivos contradice el objetivo de la tarea.
- **Tocar `dynamic-form.component.ts`.** La única modificación de PLAN-59 en ese archivo es el corte
  de `onBlur` en modo `readonly` (`dynamic-form.component.ts:219-221`), que ya está en el PR #28 y
  no está en `main`. Esta tarea no lo necesita: el trabajo vive en los cinco componentes de campo y
  en la sección del expediente.
- **Los tests de `dynamic-form.component.spec.ts`.** Ese archivo lo abre el PR #28 con dos casos de
  PLAN-59. Los tests nuevos van en archivos propios de cada componente de campo para que ambos PRs
  convivan sin conflicto.
- **Tokens de diseño nuevos.** La paleta que hace falta ya existe en
  `src/app/styles/_variables.scss` (`$color-surface-muted`, `$color-text`, `$color-text-disabled`).
  Si al implementar resultara falta alguno, se agrega el token y no un literal en el componente,
  que es la regla que ya rige en ese archivo.
- **El borde de los campos en `readonly` como indicador de no-editabilidad.** Contraste medido: el
  borde más fuerte de la paleta (`#cbd5e0`) da **1,42:1** sobre `#f8fafc` y **1,49:1** sobre blanco,
  muy por debajo del 3:1 que WCAG 1.4.11 exige para elementos de interfaz. Un borde que no se ve no
  puede ser el que comunica el estado: la distinción se logra con el tratamiento de superficie y
  con quitar la caja, no con dibujar un borde más tenue.
- **Los esqueletos con nombres en español** del backend: no se renombran.

## Preguntas abiertas

Ninguna. Las decisiones de diseño que el issue deja abiertas se resolvieron con el usuario antes de
escribir esta spec y quedan registradas como criterios:

| Decisión | Resolución |
|---|---|
| Base de la rama, dado que el PR #28 sigue abierto | Ramificar desde `main`; los tests nuevos van en archivos propios para no chocar con el #28 |
| Qué significa "estandarizar" el `readonly` | Unificar la **presentación** y mantener la semántica HTML (criterio 4) |
| Alcance del `computed()` | Los cuatro componentes, no solo los dos que nombra el issue (criterio 1) |
| Placeholder y asterisco en `readonly` | Se ocultan; el vacío se muestra con una raya (criterio 5) |
