# Plan técnico — PLAN-64

## Enfoque

1. **Tipografía:** regla `body { font-family: $font-base; }` en `src/styles.scss`.
2. **`<main>` único:** las seis páginas cambian `<main class="x">` por `<div class="x">` (y
   `supervision-main` también). Los estilos van por clase, así que no cambian.
3. **Operador:** `home.ts` suma un `computed` `hasBackofficeRole` (supervisor o administrador).
   `home.html` muestra las secciones si lo tiene y, si no, el aviso.
4. **Jurisdicción:** nuevo `LabelKind` `jurisdiction` en `labels.ts`, usado con el pipe `label` en el
   expediente, el selector de operadores y el encabezado de Supervisión.
5. **Fecha:** `formatAppDay(sheet.date)` en el aviso de `planificacion.ts`.

## Archivos a tocar

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/styles.scss` | modificar | `body` con `$font-base` |
| `src/app/pages/access-denied/access-denied.html` | modificar | `main` → `div` |
| `src/app/pages/auditoria/auditoria.html` | modificar | `main` → `div` |
| `src/app/pages/home/home.html` | modificar | `main` → `div` y aviso para el operador |
| `src/app/pages/home/home.ts` | modificar | `hasBackofficeRole` |
| `src/app/pages/login/login.html` | modificar | `main` → `div` |
| `src/app/pages/planificacion/planificacion.html` | modificar | `main` → `div` y jurisdicción traducida |
| `src/app/pages/planificacion/planificacion.ts` | modificar | Fecha del aviso con `formatAppDay` |
| `src/app/pages/supervision/supervision.html` | modificar | Los dos `main` → `div` y jurisdicción traducida |
| `src/app/core/display/labels.ts` | modificar | `jurisdiction` |
| `src/app/pages/expediente/expediente.component.ts` | modificar | Jurisdicción traducida |
| `src/app/styles/__tests__/layout-guard.spec.ts` | crear | Guardia: `body` con `$font-base` y un solo `<main>` |
| `src/app/core/display/display.spec.ts` | modificar | Etiquetas de jurisdicción |
| `src/app/pages/home/home.spec.ts` | crear | Aviso para el operador y secciones para el supervisor |
| `src/app/pages/planificacion/planificacion.spec.ts` | modificar | Fecha del aviso |
| `src/app/pages/expediente/expediente.spec.ts` | modificar | Jurisdicción traducida |

Total: 16 archivos, sobre el límite de 12: el checkpoint del plan corresponde igual. Son cambios de una
o dos líneas en casi todos.

## Decisiones técnicas

- **`div` y no `section` en las páginas:** `section` con nombre también es un landmark (`region`), y
  lo que se busca es no duplicar. La clase se conserva para no tocar ningún `.scss`.
- **Aviso en Inicio y no bloqueo del login:** ver la spec.
- **Jurisdicción como `LabelKind`:** es la capa de PLAN-29; un valor nuevo se ve crudo en vez de
  desaparecer.
- **Guardia sobre archivos para 1 y 2**, como `typography-guard.spec.ts`: un test de componente no ve
  `styles.scss` y la regla del `<main>` único es de todo el árbol.

## Supuestos

- Las jurisdicciones del seed son `ZONA_NORTE`, `ZONA_SUR` y `GLOBAL`. Verificado en las migraciones.
- Ningún test busca el elemento `main` de una página. Verificado (`grep`).
- PLAN-63 (backoffice #31, en revisión) también toca `expediente.component.ts`, en otras líneas.
  Quien entre segundo integra.

## Cómo se prueba

1. Tests nuevos y ajustados.
2. `node .agents/scripts/verificar.mjs --tarea PLAN-64` y el build.
3. En local con Chrome headless: tipografía sans en las cuatro pantallas, un solo `main` por
   pantalla, Inicio del operador con el aviso, «Zona Norte» en el expediente y la fecha dd/mm/aaaa en
   el aviso de asignación.
