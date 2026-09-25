# PLAN-54 — Móvil: agregar navegación de retorno y cierre de sesión en la pantalla de Hoja de Ruta

## Contexto y problema

En la pantalla de Hoja de Ruta (`src/app/agenda.tsx`), el operador visualiza las visitas asignadas para la jornada. Sin embargo, al tener configurado `headerShown: false` a nivel de layout de navegación, la pantalla no cuenta con barra nativa ni botones que permitan regresar a la pantalla principal de diagnóstico/sesión (`/`) o cerrar sesión directamente.

Esto obliga al usuario a depender exclusivamente de los gestos o botones de navegación del sistema operativo Android para volver atrás, y no le brinda una vía directa para cerrar su sesión desde la propia hoja de ruta.

Se requiere incorporar en la cabecera de la pantalla de Hoja de Ruta controles de navegación claros, accesibles y ergonómicos que permitan retornar a la pantalla principal y cerrar sesión, garantizando que el cierre de sesión preserve la protección de datos no sincronizados mediante la guardia existente `confirmSignOut`.

## Alcance

**Repos que toca:** `frontend` (móvil).

## Criterios de aceptación

1. **Navegación de retorno**: La pantalla de Hoja de Ruta (`src/app/agenda.tsx`) incluye un botón visible para retornar a la pantalla principal (`/`). Si la pila de navegación permite volver atrás (`router.canGoBack()`), ejecuta `router.back()`; en caso contrario, redirige a la raíz (`router.replace('/')`).
2. **Cierre de sesión seguro**: La pantalla de Hoja de Ruta incluye una acción accesible para cerrar sesión que invoca la guardia `confirmSignOut` verificando las actas pendientes de sincronización antes de ejecutar `signOut()`. Si el operador cancela la confirmación cuando hay pendientes, la sesión no se cierra; si no hay pendientes o confirma, se cierra la sesión y se redirige a `/login`.
3. **Ergonomía y accesibilidad táctil**: Los botones de acción implementados cumplen con el estándar de área táctil mínima de 48x48 dp (`MIN_TOUCH_TARGET`), cuentan con etiquetas descriptivas de accesibilidad (`accessibilityRole="button"`, `accessibilityLabel`) y respetan la paleta de colores del tema activo (claro/oscuro) para garantizar legibilidad y contraste.

## Fuera de alcance

- Modificaciones en la navegación o pantallas del backend o backoffice.
- Rediseño estructural de los componentes internos de la lista de visitas (`VisitCard`).
- Alteraciones en la lógica de sincronización o persistencia local de SQLite.

## Preguntas abiertas

Ninguna.
