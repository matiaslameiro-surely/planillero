# PLAN-43 — Supervisión: la etiqueta «Atención requerida» se superpone con el título de la tarjeta de KPI

## Contexto y problema

Al recorrer el módulo de Supervisión Central (`/supervision`) en el backoffice web, se detectó que en la primera tarjeta de KPI («Fuera de SLA / Demorados»), la etiqueta destacada «ATENCIÓN REQUERIDA» se superpone visualmente con el título de la tarjeta («Fuera de SLA / Demorados»), quedando ambos textos encimados.

Esto ocurre porque la etiqueta (`.kpi-card__priority-tag`, `supervision.html:82`) fue posicionada de manera absoluta (`position: absolute; top: 4px; right: 6px` en `supervision.scss:78-82`). Al estar fuera del flujo normal del documento, el contenedor del título no reserva espacio para la etiqueta. La etiqueta fue introducida originalmente en PLAN-30 con un tamaño pequeño (`font-size: 0.58rem` ~ 9,3px). Posteriormente, en PLAN-25 (commit `9c37917`) se incrementó su tipografía a `$font-size-glance` (13px) para cumplir con el piso tipográfico y las pautas de accesibilidad, haciéndola más ancha y provocando la superposición con el texto del título.

Adicionalmente, la tarjeta presenta redundancia textual: la etiqueta dice «Atención requerida» y el subtítulo de la misma tarjeta repite «Atención inmediata requerida», sin aportar contexto operativo diferencial.

## Alcance

**Repos que toca:** `backoffice`

- `backoffice/src/app/pages/supervision/supervision.html`
- `backoffice/src/app/pages/supervision/supervision.scss`
- Revisión complementaria de componentes con badges o tags absolutos (`evidence-viewer`, etc.) para verificar que no sufran problemas análogos de superposición.

## Criterios de aceptación

1. En la pantalla `/supervision`, la etiqueta de prioridad y el título de la tarjeta de KPI no se superponen bajo ninguna resolución estándar (desde 1920×1080 hasta pantallas angostas con el ancho mínimo de las tarjetas de ~140px definido por el `minmax` de la grilla).
2. La etiqueta forma parte del flujo estructural del componente (e.g. cabecera flex o bloque en flujo sobre el título) permitiendo el quiebre/salto de línea adecuado si el ancho disponible se reduce.
3. El tamaño de tipografía de la etiqueta se mantiene en `$font-size-glance` (13px) cumpliendo el piso tipográfico de accesibilidad y las guardias de estilo vigentes.
4. Se elimina la redundancia de texto en la tarjeta: el subtítulo provee información contextual útil (e.g. «Tiempo de visita excedido») sin repetir «atención requerida».
5. No existen otros badges o etiquetas absolutas con texto en componentes adyacentes que colisionen con títulos o encabezados.
6. Todos los gates del backoffice (`npm run build`, `npm run lint`, `npx tsc --noEmit`, `npm test`) pasan satisfactoriamente sin advertencias ni errores.

## Fuera de alcance

- Modificaciones en la lógica o contratos de la API del backend (`supervision.service` o endpoints).
- Modificaciones estructurales en otros tableros no relacionados con los indicadores KPI de supervisión.

## Preguntas abiertas

Ninguna.
