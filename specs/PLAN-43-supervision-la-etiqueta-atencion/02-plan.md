# Plan técnico — PLAN-43

## Enfoque

Se resuelve la superposición visual de la etiqueta de prioridad en la tarjeta de KPI «Fuera de SLA / Demorados» integrando la etiqueta en el flujo normal del documento dentro de una cabecera flex (`.kpi-card__header`).

Con este esquema:
1. Se elimina el posicionamiento absoluto (`position: absolute; top: 4px; right: 6px`) de `.kpi-card__priority-tag`.
2. Se introduce un contenedor estructural `.kpi-card__header` con `display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 4px;` que aloja tanto `.kpi-card__label` como `.kpi-card__priority-tag`.
3. Cuando la tarjeta tiene suficiente ancho (como en pantallas completas 1080p), el título queda a la izquierda y la etiqueta a la derecha en la misma fila.
4. Cuando el espacio se reduce (alcanzando el mínimo de ~140px por columna de la grilla), los elementos hacen wrap ordenadamente a una nueva línea sin superponerse ni recortarse.
5. Se conserva la tipografía en `$font-size-glance` (13px) asegurando la legibilidad y cumpliendo la restricción de piso tipográfico de PLAN-40.
6. Se actualiza el subtítulo redundante de la tarjeta demorada («Atención inmediata requerida») por «Tiempo de visita excedido», aportando información operacional precisa.
7. Se añaden pruebas unitarias en `supervision.spec.ts` que validen la presencia de la cabecera flex, la etiqueta y el subtítulo informativo.

## Archivos a tocar

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/pages/supervision/supervision.html` | modificar | Envolver label y priority-tag en `kpi-card__header` y cambiar subtítulo a «Tiempo de visita excedido» |
| `src/app/pages/supervision/supervision.scss` | modificar | Definir `.kpi-card__header` con flex wrap y remover `position: absolute` de `.kpi-card__priority-tag` |
| `src/app/pages/supervision/supervision.spec.ts` | modificar | Validar presencia de la cabecera flex y del nuevo texto del subtítulo |

## Decisiones técnicas

- **Estructura flex con wrap (`.kpi-card__header`)** — Se descartó colocar la etiqueta rígidamente en un bloque previo de línea completa porque en resoluciones amplias desaprovecharía el espacio horizontal aumentando innecesariamente la altura de la tarjeta; flex-wrap brinda la mejor adaptación tanto en anchos amplios (1920px) como estrechos (140px).
- **Subtítulo «Tiempo de visita excedido»** — Se descartó eliminar por completo el subtítulo o colocar un contador numérico porque el número de operadores demorados ya se exhibe de forma prominente en el valor principal de la tarjeta; «Tiempo de visita excedido» explica concretamente el motivo operativo de la demora sin redundancias.

## Supuestos

- Ninguno.

## Cómo se prueba

1. Ejecución de pruebas unitarias del backoffice con `npm test` en `backoffice/` (específicamente `supervision.spec.ts`).
2. Ejecución de linter y chequeo de tipos/build con `npm run lint` y `npm run build`.
3. Ejecución del harness de verificación: `node .agents/scripts/verificar.mjs --tarea PLAN-43`.
