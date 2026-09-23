# Plan técnico — PLAN-26

## Enfoque

Implementar un esqueleto de aplicación persistente para las rutas autenticadas del backoffice. La raíz de la aplicación (`src/app/app.ts` y `src/app/app.html`) montará un componente de navegación superior (`Navbar`) que se renderiza condicionalmente cuando existe una sesión autenticada (`AuthService.user()`), mientras que la pantalla de `/login` permanece libre de este menú.

El `Navbar` provee identidad visual («Planillero Backoffice»), enlaces a las pantallas operativas según el rol del usuario (`SUPERVISOR` → `/supervision` y `/planificacion`; `ADMINISTRATOR` → `/auditoria`; enlace a `/` para todos), indicador de ruta activa mediante `routerLinkActive`, datos del usuario conectado y botón para cerrar sesión.

Para los anchos de pantalla (`H33`), se incorporan variables canónicas de layout en `src/app/styles/_variables.scss` (`$layout-width-narrow`, `$layout-width-content`, `$layout-width-wide`) y se aplican a las pantallas existentes (`supervision`, `planificacion`, `auditoria`, `evidence-viewer`, `expediente`, `home`, `access-denied`), eliminando medidas arbitrarias dispersas.

Finalmente, para el home operativo (`H35`), se reemplaza el centrado restrictivo de 416 px con `min-height: 100vh` por una estructura de panel con tarjetas operativas y diagnóstico de backend integrado al ancho de contenido estándar.

## Archivos a tocar

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/styles/_variables.scss` | modificar | Declarar tokens canónicos de ancho de layout (`$layout-width-narrow`, `$layout-width-content`, `$layout-width-wide`). |
| `src/app/core/components/navbar/navbar.ts` | crear | Componente de navegación global persistente (identidad, links por rol, usuario, logout). |
| `src/app/core/components/navbar/navbar.html` | crear | Template de la barra superior de navegación. |
| `src/app/core/components/navbar/navbar.scss` | crear | Estilos del navbar (layout horizontal, estados activos, accesibilidad). |
| `src/app/core/components/navbar/__tests__/navbar.spec.ts` | crear | Pruebas unitarias del Navbar (renderizado por rol, enlaces, acción de logout). |
| `src/app/app.ts` | modificar | Inyectar `AuthService` para exponer el estado de usuario autenticado e importar `Navbar`. |
| `src/app/app.html` | modificar | Incluir `<app-navbar>` condicional a la sesión sobre `<router-outlet />`. |
| `src/app/app.scss` | modificar | Estilos base del esqueleto de la aplicación (layout vertical, contenedor principal). |
| `src/app/pages/home/home.html` | modificar | Reestructurar el contenido del home para aprovechar el espacio de pantalla (H35). |
| `src/app/pages/home/home.scss` | modificar | Remover centrado de 416 px / 100vh y aplicar ancho canónico `$layout-width-content`. |
| `src/app/pages/supervision/supervision.scss` | modificar | Adaptar el ancho máximo al token canónico `$layout-width-wide`. |
| `src/app/pages/planificacion/planificacion.scss` | modificar | Adaptar el ancho máximo al token canónico `$layout-width-content`. |
| `src/app/pages/auditoria/auditoria.scss` | modificar | Adaptar el ancho máximo al token canónico `$layout-width-content`. |
| `src/app/pages/evidence-viewer/evidence-viewer.scss` | modificar | Adaptar el ancho máximo al token canónico `$layout-width-content`. |
| `src/app/pages/expediente/expediente.component.ts` | modificar | Adaptar el ancho máximo al token canónico `$layout-width-content` y asegurar navegación consistente. |
| `src/app/pages/access-denied/access-denied.scss` | modificar | Adaptar el ancho máximo al token canónico `$layout-width-narrow`. |

Total de archivos: 16 (11 componentes/estilos existentes + 5 creados del Navbar). Supera el límite de 12 archivos sin checkpoint de `workspace.json`, requiriendo checkpoint obligatorio.

## Decisiones técnicas

- **Navbar condicional en `app.html` con `@if (user())`** — Se descartó crear rutas anidadas con un componente wrapper (layout route con children) porque requeriría reestructurar todas las definiciones de `app.routes.ts`, afectando guards existentes y rutas de deep linking. `@if (user())` en `app.html` es directo, reactivo mediante Signals y no altera las rutas ni la carga perezosa (`loadComponent`).
- **Tokens SCSS en `_variables.scss` para anchos canónicos** — Se descartó introducir una biblioteca de componentes externa (Material, Bootstrap) porque el proyecto mantiene una arquitectura liviana y minimalista; los tokens en `_variables.scss` ordenan el layout con cero dependencias nuevas.
- **Acceso global a cerrar sesión en el Navbar** — Se descartó dejar la acción de logout exclusivamente en el Home (`/`), porque obligaba al supervisor en cualquier pantalla operativa a navegar primero al inicio sólo para desconectarse.

## Supuestos

- Ninguno. La lógica de roles (`SUPERVISOR`, `ADMINISTRATOR`) y el servicio `AuthService` ya están implementados y probados en el repositorio.

## Cómo se prueba

1. **Pruebas automáticas (`npm test`)**:
   - Pruebas del nuevo componente `Navbar` verificando:
     - Renderizado de enlaces según roles (`SUPERVISOR` ve Supervisión y Planificación; `ADMINISTRATOR` ve Auditoría).
     - Ejecución de `logout()` al hacer clic en «Cerrar sesión».
     - Enlace al inicio siempre disponible.
   - Ejecución de la suite completa de pruebas unitarias existentes (67 pruebas actuales) para asegurar que ningún cambio rompe pantallas previas.
2. **Chequeo de compilación y tipos (`npm run build`)**:
   - Validación completa de templates y TypeScript en modo estricto.
3. **Linter (`npm run lint`)**:
   - Conformidad estricta con ESLint y reglas del proyecto.
