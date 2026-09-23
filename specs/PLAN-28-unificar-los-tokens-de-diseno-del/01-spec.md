# PLAN-28 — Unificar los tokens de diseño del backoffice y exponerlos como custom properties CSS

## Contexto y problema

El backoffice se siente como seis productos distintos con el mismo login. La auditoría UX/UI de
PLAN-18 lo midió (hallazgos H6 y H7): la heurística **Consistencia y estándares** fue la peor del
informe.

Existe `src/app/styles/_variables.scss`, cuyo propio comentario declara la regla: «Todo color,
espaciado o radio sale de acá: nada se escribe a mano en los componentes». La regla no se cumple:

- Sólo cuatro de las diez hojas de estilo lo importan (`home`, `login`, `planificacion`,
  `auditoria`); no lo hacen `supervision.scss`, `evidence-viewer.scss`, `access-denied.scss`,
  `supervision-map.scss`, `route-map.scss` ni `app.scss`.
- Los seis componentes con estilos embebidos (`field-text`, `field-number`, `field-select`,
  `field-boolean`, `field-multiselect`, `dynamic-form`) **no pueden** importar una variable SCSS de
  otro archivo: una variable así no les llega. Tampoco le llega a `expediente`.
- El mismo rol visual, «acción primaria», está pintado de cuatro azules: `#208aef` (login/home),
  `#0284c7` (refresco del tablero), `#2563eb` (verificación y enlaces del visor), `#2b6cb0`
  (formularios dinámicos). Los grises de texto secundario siguen tres escalas ajenas entre sí:
  `#718096`, `#64748b` y `#94a3b8` (Tailwind slate), `#4b5563`, `#475569`, `#6b7280`.
- `$color-info` (`#6c3fc5`) no se usa en ninguna pantalla, mientras que el violeta del KPI de SLA de
  Supervisión usa `#7c3aed` escrito a mano.

Estado de la deuda tras los merges recientes (PLAN-25/26/27/30):

- PLAN-25 ya agregó `$color-text-muted: #5b6778` (5,74:1), `$color-status-ok: #15803d` y
  `$color-status-alert: #b91c1c` (escala de estados periciales), y el piso tipográfico
  (`$font-size-min`, `$font-size-glance`). También migró varios literales de los componentes a los
  tokens **dejando el valor literal repetido con un comentario** (por ej. `color: #c0392b; /* $color-error: 5,44:1 */`), porque los estilos embebidos no pueden consumir la variable SCSS.
- PLAN-30 recomendó `#b45309` (5,02:1) para el KPI «Demorado» de Supervisión, hoy `#d97706` (3,19:1,
  margen justo).

Esta tarea cierra de raíz los hallazgos de contraste que son consecuencia directa de la divergencia.

## Alcance

**Repos que toca:** `backoffice`.

## Criterios de aceptación

1. Existe **un único lugar** que define la escala de color y los valores se **exponen como custom
   properties CSS** en `:root` (hoja global `src/styles.scss`), de modo que los componentes con
   estilos embebidos también los consuman vía `var(--token)`.
2. **Cero colores hexadecimales escritos a mano** en componentes (`.ts`) ni en hojas de página
   (`.scss`). Se verifica con una búsqueda de `#[0-9a-fA-F]{3,8}` sobre `src/app/`
   (la única excepción es `_variables.scss` y los valores de ejemplo de internals de Leaflet, si los
   hay).
3. Todos los pares de uso de la escala (texto sobre fondo, estado sobre su fondo) cumplen **WCAG AA**:
   cada doblete de color en uso se audita con un script de contraste y los que estén por debajo de
   4,5:1 a su tamaño real se corrigen. El listado de pares queda documentado en la spec de la
   implementación.
4. El KPI «SLA» de Supervisión pasa de `#7c3aed` al token violeta de la escala (`$color-info`), y el
   KPI «Demorado» de `#d97706` a `#b45309` (≥ 4,5:1 a 13 px).
5. Los botones deshabilitados conservan el par medido por PLAN-25 (fondo `#e2e8f0`, texto `#475569`,
   6,15:1) vía token.
6. Los gates del backoffice quedan en verde (`npm run lint`, `npm run build`, `npm test`).

## Fuera de alcance

- `backend` y `frontend`: no se tocan en esta tarea.
- Los tokens de espaciado, radio y tipografía: ya salen de `_variables.scss`; la escala que se unifica
  es la de **color**. Si un reemplazo obliga a tocar un espaciado literal, se pasa al token existente,
  pero no se rediseñan medidas.
- Renombrar los identificadores del esqueleto legado en español (convención del repo: se dejan como
  están salvo que se toquen por necesidad).
- Comportamiento de negocio, rutas, servicios y plantillas de los componentes: nada cambia en el
  flujo, sólo los estilos.
- Sombreados (`box-shadow` con `rgba(...)`) y overlays con alpha: no son hexadecimales escritos a
  mano; se conservan o se tokenizan si entorpecen la lectura, pero no son el foco.
- No se cambian valores ya validados por PLAN-25 donde cumplen AA (por ej. `$color-status-alert`,
  `$color-text-muted`): se reutilizan como ancla de la escala.

## Preguntas abiertas

- [x] `NO-BLOQUEANTE` — **Debate de producto, no de factibilidad.** La paleta de los KPIs de
  Supervisión es propia (verde `#10b981/#059669`, violeta `#8b5cf6/#7c3aed`, ámbar `#f59e0b/#d97706`,
  rojo `#ef4444/#b91c1c`, celeste `#0284c7/#0369a1`). Los estados `ok/alert/warning/info` van a
  quedarse con tokens **semánticos** propios (cada rol conserva su color, pero sale de la escala),
  porque unificar todos los estados a un solo color rompería el significado. Esta tarea no decide si
  la paleta de KPIs se rediseña: decide que sus valores salgan de la escala definida.
- [ ] `NO-BLOQUEANTE` — **Fondo de fila con estado.** `evidence-viewer.scss` usa `#fff1f2` para filas
  con veredicto alterado; `supervision.scss` usa fondos pastel (`#fef2f2`, `#fffbeb`, `#fffdfa`).
  Se tokenizan como fondos de estado (compañeros del par `ok/alert`), no como grises neutros.