# Tareas — PLAN-60

Alcance: `backoffice`. No hay backend ni móvil, y no hay contrato de API que leer.

## backoffice *(web)*

- [x] `[backoffice]` Crear `src/app/forms/fields/readonly-contract.ts` con el contrato compartido:
      el nombre del atributo `data-readonly` y la constante `READONLY_STYLES` con el tratamiento
      único (fondo, color de texto, `cursor: default`, sin caja, corrección de
      `-webkit-text-fill-color`, foco visible preservado). Reexportarlo desde `fields/index.ts`.
- [x] `[backoffice]` `field-select.component.ts`: derivar `enumValues` con `computed()`, eliminar
      `ngOnInit`, aplicar el contrato al contenedor, y en readonly sacar la opción de arranque y
      mostrar la raya cuando no hay valor. Ocultar el asterisco de requerido en readonly.
- [x] `[backoffice]` `field-multiselect.component.ts`: derivar `enumValues` con `computed()`, eliminar
      `ngOnInit`, aplicar el contrato, y quitar `cursor: pointer` a los chips en readonly conservando
      la distinción de los seleccionados.
- [x] `[backoffice]` `field-text.component.ts`: derivar `maxLength` con `computed()`, eliminar
      `ngOnInit`, aplicar el contrato y ocultar el asterisco en readonly.
- [x] `[backoffice]` `field-number.component.ts`: derivar `isInteger` con `computed()`, eliminar
      `ngOnInit` y su uso en `onInput`, aplicar el contrato y ocultar el asterisco en readonly.
- [x] `[backoffice]` `field-boolean.component.ts`: aplicar el contrato y quitar `cursor: pointer`
      al switch en readonly, conservando el estado encendido/apagado.
- [x] `[backoffice]` `expediente.component.ts`: agregar `role="group"` y nombre accesible a
      `.form-section`, conservando la nota visible para que siga el test existente.
- [x] `[backoffice]` Crear `fields/__tests__/readonly-contract.spec.ts`: auditoría de los cinco
      archivos (mismo contrato aplicado, contraste AA por cálculo de luminancia, sin `opacity`).
- [x] `[backoffice]` Crear `fields/__tests__/field-components.spec.ts`: reactividad del `schema()`
      sin recrear el componente, y no emisión de `valueChange` en readonly en los cinco.

## Desvíos del plan, y por qué

Tres cosas se hicieron distinto a lo planificado. Quedan anotadas porque el plan es un artefacto
registrado, no una predicción: si no se anotan, el próximo que lea estos artefactos asume que el
plan se cumplió tal cual y no sabe qué decisiones se tomaron sobre la marcha.

1. **Placeholder oculto en solo lectura.** El plan lo daba por hecho al decir «aplicar el contrato»,
   pero el contrato no alcanza al `placeholder`: es un atributo del elemento, no una regla de estilo.
   Sin tocarlo, el campo de texto seguía mostrando la descripción como texto gris, que es
   justamente la señal de «acá se escribe algo» que la tarea pide eliminar. Se agregó
   `readonly() ? '' : description()` en texto y número, con test.
2. **Caja del `select`.** El contrato compartido solo puede usar selectores genéricos, y el borde
   de este `select` no está en el `<select>` sino en el `.select-wrapper` que lo envuelve. La regla
   que lo apaga quedó en el componente, con un comentario que explica por qué no puede estar en el
   contrato. Sin esto, el selector en solo lectura se veía igual que en edición.
3. **`[data-readonly] .chip:not(.chip-selected)`.** Aplicar la regla a todos los chips la hacía
   ganarle por especificidad a `.chip-selected` y apagaba también los seleccionados, con lo cual se
   veía qué opciones existen pero no cuáles están elegidas.

## Restricción que no se puede cubrir con un test

El `styles` de cada componente es un literal de template. Un backtick escrito dentro del CSS —
incluso dentro de un comentario, para nombrar una clase — cierra el literal en ese punto. El build
falla con `Failed to resolve styles at position 0 to a string`, que **no menciona el archivo ni la
línea**, y la suite ni llega a ejecutarse, así que ningún test lo puede atrapar. Queda documentado en
la cabecera de `readonly-contract.ts`.

## Verificación

- [x] Gates del repo en verde: `npm run build`, `npm run lint`, `npm test` (22 archivos, 217 tests).
      Los tres warnings de CommonJS (`ajv`, `ajv-formats`, `leaflet`) son preexistentes.
- [x] Gates del harness: `node .agents/scripts/verificar.mjs --tarea PLAN-60`
- [x] Revisión independiente sin hallazgos `critical` ni `high` (05-revision-backoffice-2.json)
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto por un test
- [x] Confirmado que el diff no toca `dynamic-form.component.ts` ni
      `forms/__tests__/dynamic-form.component.spec.ts` (archivos del PR #28)
