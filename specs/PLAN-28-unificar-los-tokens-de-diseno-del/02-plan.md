# Plan técnico — PLAN-28

## Enfoque

Se unifica toda la paleta del backoffice en **una sola escala de color** declarada en
`src/app/styles/_variables.scss`, y se **expone como CSS custom properties** en un bloque `:root`
emitido desde la hoja global `src/styles.scss`. De ese modo los seis componentes con estilos
embebidos (`field-*`, `dynamic-form`) y `expediente`, que no pueden `@use` las variables SCSS,
consumen la escala con `var(--token)` igual que las hojas de página.

Reglas de la migración:

1. **Todo color pasa a `var(--token)`**, tanto en hojas `.scss` como en estilos embebidos `.ts`. Las
   hojas conservan el `@use` actual, pero sólo porque siguen necesitando `$spacing-*`, `$radius-*`,
   `$font-*` y `$layout-*`; ningún `$color-*` se usa fuera de `_variables.scss`.
2. **Los tokens son los que PLAN-23 y PLAN-25 ya validaron**, más un ancla para texto principal,
   fondo/borde y estados. No se rediseña la paleta: se convergen los valores divergentes (los 4
   azules de acción, las 3 escalas de gris de texto, el violeta del KPI, el ámbar del KPI) hacia un
   único token por rol.
3. **Los estados conservan su color semántico** (ok/alert/pending/info/neutral): cada rol vive en
   la escala con un token para texto, uno para fondo y uno para borde, para no perder el significado
   ni romper AA en los pares.

La escala propuesta (tabla para revisión en el checkpoint):

| Token CSS | Valor | Reemplaza | Rol |
|---|---|---|---|
| `--color-primary` | `#1268bd` | `#2b6cb0`, `#2563eb`, `#0284c7`, `#1d4ed8`, `#208aef` | Acción primaria: botones, enlaces, switch, chips, marcas |
| `--color-text` | `#111827` | `#1a1a1a` | Texto principal |
| `--color-text-muted` | `#5b6778` | `#4b5563`, `#475569`, `#64748b`, `#6b7280`, `#718096`, `#94a3b8` (texto) | Texto secundario (5,74:1) |
| `--color-text-disabled` | `#475569` | `#475569` (sobre `#e2e8f0`) | Texto en estado deshabilitado (6,15:1) |
| `--color-surface` | `#ffffff` | `#fff`, `#ffffff` | Fondos de tarjetas, navbar, modales |
| `--color-surface-muted` | `#f8fafc` | `#f7fafc`, `#f8fafc`, `#fafafa` | Fondos casi blancos (headers de tabla, inputs readonly) |
| `--color-surface-subtle` | `#f1f5f9` | `#f1f5f9`, `#f3f4f6` | Fondo gris claro / borde fino |
| `--color-border` | `#e2e8f0` | `#e2e8f0`, `$color-border` (`#d9d9d9`) | Tarjetas, separadores, fondo deshabilitado |
| `--color-border-strong` | `#cbd5e0` | `#cbd5e0`, `#cbd5e1` | Inputs, chips, selects, spinners |
| `--color-status-ok` | `#15803d` | `#10b981`, `#059669`, `#14532d`, `#166534` | Texto/dato íntegro, KPI completo (5,02:1) |
| `--color-status-ok-bg` | `#dcfce7` | `#dcfce7`, `#f0fdf4` | Fondo ok (4,57:1 con su texto) |
| `--color-status-ok-border` | `#86efac` | `#86efac` | Borde ok |
| `--color-status-alert` | `#b91c1c` | `#ef4444`, `#dc2626`, `#7f1d1d`, `#991b1b` | Texto alterado / KPI offline (6,47:1) |
| `--color-status-alert-bg` | `#fee2e2` | `#fee2e2`, `#fef2f2`, `#fff1f2`, `#fffafb` | Fondo alterado (5,89:1 con su texto) |
| `--color-status-alert-border` | `#fca5a5` | `#fca5a5`, `#fecaca`, `#f87171` | Borde alerta |
| `--color-status-pending` | `#b45309` | `#d97706`, `#92400e`, `#8a5806`, `#b45309` | KPI demorado, badge pendiente (5,02:1) |
| `--color-status-pending-bg` | `#fef3c7` | `#fef3c7`, `#fffbeb`, `#fff7ed`, `rgba(185,119,14,.15)` | Fondo pendiente |
| `--color-status-pending-border` | `#fde68a` | `#fde68a`, `#f59e0b` | Borde pendiente |
| `--color-status-info` | `#0369a1` | `#0284c7`, `#0369a1` | Celeste de estado: en campo, cargando (5,93:1) |
| `--color-status-info-bg` | `#e0f2fe` | `#e0f2fe`, `#dbeafe`, `#f0f9ff` | Fondo celeste |
| `--color-status-info-border` | `#bae6fd` | `#bae6fd` | Borde celeste |
| `--color-status-neutral` | `#475569` | `#64748b`, `#475569`, `#6b7280` (badges) | Estado neutro: offline, count |
| `--color-status-neutral-bg` | `#f1f5f9` | `#f1f5f9` (badge), `#f8fafc` (operador) | Fondo neutro |
| `--color-info` | `#6c3fc5` | `#7c3aed` | Violeta KPI SLA y badges info (token ya declarado, hoy sin uso) |
| `--color-warning` | `#b9770e` | `#b9770e` | Advertencia del token actual (bordes) |
| `--color-error` | `#c0392b` | `#c0392b` | Error del token actual (5,44:1) |
| `--color-success` | `#1a9e5c` | `#1a9e5c` | Éxito del token actual |
| `--color-overlay` | `rgba(15,23,42,.7)` | `rgba(15,23,42,.7)` | Capa de confirmación de Planificación |
| `--color-overlay-light` | `rgba(255,255,255,.9)` | `rgba(255,255,255,.9)` | Overlay del mapa de Supervisión |

Las sombras (`box-shadow` con alpha) se dejan como están: no son colores de la escala y la spec las
declaró fuera de foco.

## Archivos a tocar

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/styles/_variables.scss` | modificar | Ampliar la escala: texto, superficies, bordes y estados; cada token con su rol y ratio |
| `src/styles.scss` | modificar | Emitir el bloque `:root { --color-*: #{$color-*}; }` con la escala completa (los componentes embebidos la consumen de acá) y migrar los pills/badges globales a `var()` |
| `src/app/core/components/navbar/navbar.scss` | modificar | Migrar `#111827`, `#4b5563`, `#6b7280`, `#f3f4f6`, `#ffffff`, `#1f2937`, `#eff6ff`, `#fff5f5` a la escala |
| `src/app/pages/home/home.scss` | modificar | Idem: `#111827`, `#4b5563`, `#6b7280`, `#ffffff`, `#e2e8f0`, `#475569`, `$color-border` |
| `src/app/pages/login/login.scss` | modificar | Idem: `#fff`, `#e2e8f0`, `#475569` |
| `src/app/pages/auditoria/auditoria.scss` | modificar | Idem: `#fff`, `#e2e8f0`, `#475569` |
| `src/app/pages/planificacion/planificacion.scss` | modificar | Idem: `#fff`, `#4b5563`, `#8a5806`, `#e2e8f0`, `#475569`, `rgba(...)` |
| `src/app/pages/planificacion/route-map/route-map.scss` | modificar | Agregar token de texto atenuado: `#6b7280` |
| `src/app/pages/supervision/supervision.scss` | modificar | Migrar logo completo de KPIs, badges, alerts y operadores a la escala |
| `src/app/pages/supervision/supervision-map/supervision-map.scss` | modificar | Migrar `#e2e8f0`, `#64748b`, `#475569`, `#eee`, fondos y badges |
| `src/app/pages/evidence-viewer/evidence-viewer.scss` | modificar | Migrar bloques de estados, veredictos y meta a la escala |
| `src/app/pages/access-denied/access-denied.scss` | modificar | Migrar `#4b5563`, `#2563eb` |
| `src/app/pages/expediente/expediente.component.ts` | modificar | Migrar estilos embebidos (badges, urgencia, links, tabs, no-form) a `var()` |
| `src/app/forms/dynamic-form.component.ts` | modificar | Migrar estilos embebidos (submit, disabled, spinner, empty) a `var()` |
| `src/app/forms/fields/field-text.component.ts` | modificar | Migrar embebidos a `var()` (label, required, input, error, readonly) |
| `src/app/forms/fields/field-number.component.ts` | modificar | Idem |
| `src/app/forms/fields/field-select.component.ts` | modificar | Idem |
| `src/app/forms/fields/field-boolean.component.ts` | modificar | Idem (switch) |
| `src/app/forms/fields/field-multiselect.component.ts` | modificar | Idem (chips) |

19 archivos > `limiteArchivosSinCheckpoint` (12) → **checkpoint obligatorio**.

## Decisiones técnicas

- **Exponer la escala como custom properties en `:root` en vez de mover los estilos a `.scss`.** Se
  descartó extraer los estilos embebidos a archivos `.scss` (que era la alternativa de Federico en
  el comentario de PLAN-25) porque multiplica archivos por componente y no hace falta: Angular
  resuelve `var()` en runtime, así que los estilos embebidos consumen la escala igual que las hojas,
  con un único mecanismo.
- **`var(--token)` en todos lados, incluso en hojas que ya importan `_variables`.** Se descartó seguir
  usando `$color-*` en las hojas con `@use`: deja dos mecanismos de consumo e impide que un color
  nuevo pasara por la escala donde no se importa la hoja. Un solo mecanismo hace el criterio «cero
  hex a mano» verificable por grep.
- **Los tokens de estado llevan trío `bg`/`border`/`fg`.** Se descartó un único token por estado:
  los pares AA (p. ej. `#15803d` sobre `#dcfce7` = 4,57:1) dependen del fondo, y fundir bg con fg
  rompería el contraste documentado por PLAN-25.
- **Unificar `#d9d9d9` (token actual `$color-border`) en `#e2e8f0`.** El gris actual es el más claro
  del par dominante; `#e2e8f0` es el que ya usan tarjetas, tablas y navbar. Un único borde por rol.
- **`#475569` vive en dos tokens** (`--color-text-muted` decide por contexto; como `--color-text-disabled`
  es texto sobre fondo `#e2e8f0`). La diferencia es el fondo sobre el que se apoya; el par disabled se
  mantiene como lo midió PLAN-25 (6,15:1).

## Supuestos

- `RIESGO` — El cambio de tono en `btn-refresh` (de `#0284c7` a `#1268bd`) y los celestes de estado
  (a `#0369a1`) altera levemente la imagen actual de Supervisión. Silo que ya no se nota la distinción
  entre integro/y estado, hay que revisar el par en la verificación visual.
- `RIESGO` — Unificar los cuatro fondos alterados (`#fee2e2`, `#fef2f2`, `#fff1f2`, `#fffafb`) en
  `#fee2e2` puede aplanar la fila marcada del visor de evidencias; que no se distinga del resto es un
  defecto de claridad, no de contraste.
- El token `$color-info` (`#6c3fc5`) ya existe y cumple AA sobre blanco: es un violeta lo
  suficientemente oscuro para el KPI de SLA (más seguro que `#7c3aed`).
- Angular resuelve las custom properties del `:root` dentro de los estilos embebidos (ViewEnlace
  `ViewEncapsulation.Emulated`): las variables se heredan por el DOM y funcionan en componentes con
  `styles: [...]`.
- Los demás tokens (spacing, radius, font, layout) no se tocan: sólo color es el alcance.

## Cómo se prueba

- Criterio 2 (cero hex a mano): `rg '#[0-9a-fA-F]{3,8}'` sobre `src/` excluyendo `_variables.scss` y
  el CSS de Leaflet; debe dar cero.
- Criterio 3 (WCAG AA en pares): script Node ad-hoc (en la carpeta de la tarea) que calcula el ratio
  de cada par `fg`/`bg` de la escala y lo vuelca a una tabla; se incluye en el PR.
- Criterios 4 y 5: búsquedas puntuales de `#d97706`, `#7c3aed`, `#2b6cb0`, `#2563eb`, `#0284c7` que
  deben dar cero en `src/app/`.
- Criterio 6: `npm run lint`, `npm run build`, `npm test`.