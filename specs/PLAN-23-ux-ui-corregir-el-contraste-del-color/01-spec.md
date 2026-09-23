# PLAN-23 — UX/UI: corregir el contraste del color primario, el idioma del documento y los acentos de la grilla

## Contexto y problema

La auditoría UX/UI de PLAN-18 (`docs/auditoria-ux-ui.md` en el backoffice, PR #11) dejó tres hallazgos
que se arreglan con una línea cada uno, tienen riesgo cero y se verifican de forma trivial. El issue
los agrupa a propósito en una sola tarea y una sola rama: separarlos costaría más que resolverlos.

1. **H27 — contraste del color primario (la única severidad crítica).** `$color-primary: #208aef`
   (`src/app/styles/_variables.scss:6`) da **3,53:1** con texto blanco encima, por debajo del mínimo
   WCAG 2.1 AA de 4,5:1. Es el color de todos los botones de acción del login y del home: lo primero
   que ve cualquier usuario del sistema. También falla usado como texto sobre blanco en el botón
   secundario.
2. **H9 — idioma declarado.** `src/index.html:2` declara `<html lang="en">` con el cien por ciento de
   la interfaz en español. Afecta a los lectores de pantalla, que pronuncian el español con fonética
   inglesa, a la corrección ortográfica del navegador y a la selección tipográfica.
3. **H10 — acentos en la grilla de visitas.** Los encabezados de
   `src/app/pages/planificacion/planificacion.html` dicen «Codigo», «Direccion» y «Sincronizacion»,
   mientras el resto de la misma pantalla acentúa correctamente.

## Alcance

**Repos que toca:** `backoffice`

No toca el backend ni la aplicación móvil: los tres hallazgos son de la capa de presentación del
backoffice web y no hay contrato de API involucrado.

## Criterios de aceptación

1. El token `$color-primary` de `src/app/styles/_variables.scss` tiene un ratio de contraste **≥ 4,5:1
   sobre blanco**, calculado con la fórmula de luminancia relativa de WCAG 2.1, no estimado a ojo. El
   valor adoptado y su ratio quedan documentados en el plan.
2. El nuevo token conserva el matiz azul institucional: no se cambia el color por otro de otra familia.
3. `src/index.html` declara `<html lang="es">`.
4. Los encabezados de la grilla de visitas de `planificacion.html` se leen «Código», «Dirección» y
   «Sincronización», acentuados.
5. Los tres gates del backoffice (`npm run lint`, `npm run build`, `npm test`) quedan en verde.

## Fuera de alcance

- **Revisar el contraste del resto de la paleta.** `$color-success`, `$color-error`, `$color-warning`
  y `$color-info` no se auditan acá; si alguno falla, es otro issue.
- **Unificar o exponer los tokens como custom properties CSS.** Eso es PLAN-28.
- **Internacionalización real** (i18n, archivos de traducción). Acá sólo se corrige el atributo `lang`.
- **Revisar la ortografía del resto del backoffice.** Sólo los encabezados de esta grilla.
- **Cualquier cambio de layout, jerarquía o navegación.** Son PLAN-26 y PLAN-30.

## Preguntas abiertas

- [ ] `NO-BLOQUEANTE` — El encabezado `Accion` (`planificacion.html:80`) de la misma grilla también
  está sin acentuar, pero el issue no lo menciona: lista sólo las líneas 74, 75 y 78. Es el mismo
  defecto, en la misma tabla, y dejarlo afuera obligaría a abrir un issue nuevo para una tilde. **Se
  asume que corresponde corregirlo también** y se deja anotado acá para que la revisión humana pueda
  discrepar. No bloquea: si el criterio fuera el contrario, se revierte esa línea sola.
