# Tareas — PLAN-26

## backoffice *(web)*

- [x] `[backoffice]` Definir tokens de anchos canónicos (`$layout-width-narrow`, `$layout-width-content`, `$layout-width-wide`) en `src/app/styles/_variables.scss`.
- [x] `[backoffice]` Crear el componente de navegación global `Navbar` (`navbar.ts`, `navbar.html`, `navbar.scss`) con enlaces condicionales por rol (`SUPERVISOR`, `ADMINISTRATOR`), indicador de ruta activa, identificación de usuario y botón de logout.
- [x] `[backoffice]` Agregar pruebas unitarias para `Navbar` en `src/app/core/components/navbar/__tests__/navbar.spec.ts`.
- [x] `[backoffice]` Integrar `Navbar` en `src/app/app.ts`, `src/app/app.html` y `src/app/app.scss` bajo condición de sesión autenticada (`@if (user())`).
- [x] `[backoffice]` Reestructurar la pantalla Home (`src/app/pages/home/home.html`, `src/app/pages/home/home.scss`) eliminando el centrado de 416 px / 100vh y adaptándola al ancho de contenido estándar.
- [x] `[backoffice]` Aplicar los tokens de ancho canónico en las pantallas restantes: `supervision`, `planificacion`, `auditoria`, `evidence-viewer`, `expediente` y `access-denied`.
- [x] `[backoffice]` Verificar consistencia de navegación y eliminación de callejones sin salida en `expediente` y `supervision`.

## Verificación

- [x] Gates en verde en los repos del alcance (`node .agents/scripts/verificar.mjs --tarea PLAN-26`)
- [x] Revisión independiente sin hallazgos `critical` ni `high` (`node .agents/scripts/revisar.mjs --tarea PLAN-26 --repo backoffice`)
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto
