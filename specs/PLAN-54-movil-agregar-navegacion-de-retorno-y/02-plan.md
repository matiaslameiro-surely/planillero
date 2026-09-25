# Plan técnico — PLAN-54

## Enfoque

En la pantalla `src/app/agenda.tsx`, la vista `Agenda` carece de controles para volver a la pantalla principal (`/`) o cerrar sesión. Incorporaremos una barra de navegación superior ergonómica (`navBar`) situada justo debajo de las barras de estado (`DeviceStatusBar` / `SyncQueueBanner`) y antes del encabezado de la hoja de ruta.

Esta barra contendrá:
1. Un botón de navegación de retorno a la izquierda con el texto `← Volver` (o `← Inicio`), etiqueta de accesibilidad clara y dimensiones táctiles mínimas de 48 dp. Al accionarse, evalúa `router.canGoBack()` para ejecutar `router.back()` si hay historial, o `router.replace('/')` en caso contrario.
2. Un botón de cierre de sesión a la derecha con el texto `Cerrar sesión`, etiqueta de accesibilidad y dimensiones ergonómicas mínimas de 48 dp. Al accionarse, obtiene el conteo fresco de actas pendientes mediante `queue.reload()` y ejecuta `confirmSignOut(pendientes)`. Si la confirmación es positiva, procede con `signOut()`, lo cual transiciona el estado de sesión a `signedOut` y redirige a `/login`.

Complementaremos con un conjunto de pruebas automatizadas en `src/app/__tests__/agenda.test.tsx` que verifique la presencia de los botones, sus áreas táctiles mínimas (>= 48 dp), atributos de accesibilidad y el comportamiento ante eventos de pulsación.

## Archivos a tocar

### frontend/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/agenda.tsx` | modificar | Agregar barra de navegación ergonómica con botón de retorno (`router.back()` / `replace('/')`) y botón de cierre de sesión protegido con `confirmSignOut`. |
| `src/app/__tests__/agenda.test.tsx` | crear | Pruebas unitarias y de render para verificar accesibilidad, áreas táctiles de 48 dp y callbacks de navegación y logout. |

## Decisiones técnicas

- **Barra de navegación dedicada (`navBar`) integrada en la vista** — Se descartó usar botones flotantes o menús desplegables (hamburguesa/overflow) porque bajo condiciones de campo (sol directo, tablets, guantes) se prioriza la previsibilidad visual y la accesibilidad táctil inmediata sin pasos adicionales.
- **Retorno condicional con fallback a raíz (`canGoBack() ? back() : replace('/')`)** — Se descartó invocar ciegamente `router.back()` porque si la pantalla se abre mediante deep-link o recarga sin pila de navegación previa, `router.back()` no tiene efecto; el fallback garantiza retornar a `/`.
- **Reutilización de `confirmSignOut` y `queue.reload()`** — Se descartó implementar un diálogo ad-hoc o desloguear directamente, para mantener estricta paridad con `src/app/index.tsx` y no provocar pérdida accidental de actas locales no sincronizadas.

## Supuestos

- Ninguno.

## Cómo se prueba

- `npm test -- --watchAll=false`: ejecución de toda la suite de pruebas unitarias incluyendo el nuevo test `src/app/__tests__/agenda.test.tsx`.
- `npx tsc --noEmit`: chequeo estático de tipos de TypeScript.
- `npm run lint`: validación de reglas de ESLint del proyecto frontend.
