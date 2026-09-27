# Plan técnico — PLAN-79

## Enfoque

- **Expediente:** en el encabezado, junto al estado y la urgencia, un link
  `<a [routerLink]="['/evidence', visit.id]">Ver evidencias</a>` con estilo de botón secundario. Sólo
  se renderiza en la rama `visit()`, así que en los estados de carga o error (PLAN-63) no aparece.
- **Visor:** el link de volver depende del rol. Con `SUPERVISOR` → «← Volver al expediente»
  (`/expediente/<id>`); si no → «← Volver al Panel» (`/`). El rol sale de `AuthService.user()`, que
  ya está cargado porque la ruta tiene `authenticatedGuard`.

## Archivos a tocar

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/pages/expediente/expediente.component.ts` | modificar | Link «Ver evidencias» y su estilo |
| `src/app/pages/expediente/expediente.spec.ts` | modificar | Presencia y destino del link; ausencia en 403/404 |
| `src/app/pages/evidence-viewer/evidence-viewer.ts` | modificar | `computed` con el destino y el texto de volver según el rol |
| `src/app/pages/evidence-viewer/evidence-viewer.html` | modificar | Usar ese destino y texto |
| `src/app/pages/evidence-viewer/evidence-viewer.spec.ts` | modificar | Supervisor → expediente; administrador/operador → Panel |

## Decisiones técnicas

- **Volver según el rol.** Se descartó mandar siempre al expediente: un administrador u operador
  terminaría en «Acceso denegado». También se descartó mostrar los dos links: son dos salidas para lo
  mismo.
- **Link, no botón.** Es navegación, así que va como `<a routerLink>` (se puede abrir en otra
  pestaña). Se estiliza como botón secundario para que se vea como una acción del expediente.

## Supuestos

- Mientras el visor esté abierto, `AuthService.user()` tiene el usuario (lo garantiza
  `authenticatedGuard`).
- No hay supuestos `RIESGO`.
