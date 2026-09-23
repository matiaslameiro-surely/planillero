# PLAN-26 — Dar navegación global al backoffice: hoy la aplicación no tiene esqueleto

## Contexto y problema

Actualmente, la raíz del backoffice web (`src/app/app.html`) consiste únicamente en `<router-outlet />`. No existe barra superior, navegación persistente, indicador de sección activa ni identidad de marca continua a lo largo de la experiencia autenticada.

Esto produce graves problemas de usabilidad identificados en la auditoría UX/UI de PLAN-18:
1. **Falta de navegación global (`H17`)**: El usuario debe memorizar los destinos existentes o regresar al inicio para saber qué pantallas están habilitadas para su rol.
2. **Callejones sin salida y desfasaje de regreso (`H8`)**: Pantallas como supervisión y expediente no tienen ningún botón o enlace de regreso, obligando a usar el botón «Atrás» del navegador. Asimismo, en las pantallas que sí tienen enlace de regreso se usan nombres divergentes («Volver al inicio» vs «← Volver al Panel»).
3. **Dispersión de anchos de pantalla (`H33`)**: Cada pantalla define de forma arbitraria un `max-width` diferente (1400 px en supervisión, 1280 px / 80rem en planificación y auditoría, 1200 px en evidencias, 900 px en expediente, 416 px en home y login), provocando que al navegar el contenido cambie erráticamente de ancho en cada transición.
4. **Home operativo desaprovechado (`H35`)**: La pantalla de inicio (`/`) se encuentra centrada en una única columna de 416 px (`26rem`) con `min-height: 100vh`, dejando desierto el 78 % de un monitor estándar de oficina (1080p) y apilando las tarjetas de acceso verticalmente como si fuera un formulario de login.

## Alcance

**Repos que toca:** `backoffice`

## Criterios de aceptación

1. **Esqueleto y navegación global persistente (`H17`)**:
   - Para las pantallas autenticadas se presenta un componente de navegación / cabecera global persistente que incluye:
     - Identidad visual del producto («Planillero Backoffice»).
     - Menú de navegación que enumera las secciones habilitadas según los roles del usuario autenticado (ej. Inicio/Panel, Supervisión y Planificación si el usuario tiene rol `SUPERVISOR`; Auditoría si tiene rol `ADMINISTRATOR`).
     - Información de la sesión activa (usuario logueado) y acción para cerrar sesión (`Cerrar sesión`).
   - La pantalla de login (`/login`) permanece sin la navegación global de sesión.
2. **Indicador de ruta activa**:
   - Los enlaces de navegación señalan visualmente qué sección se encuentra activa en el momento de la navegación.
3. **Eliminación de callejones sin salida y consistencia de navegación (`H8`)**:
   - Desde cualquier pantalla autenticada es posible acceder de forma directa e inmediata a las demás secciones disponibles y al inicio/panel a través de la barra de navegación persistente, eliminando los callejones sin salida en supervisión y expediente.
   - En las pantallas de detalle (como el visor de evidencias o el expediente), si se incluye navegación de retorno contextual, esta debe ser consistente y predecible.
4. **Conjunto canónico de anchos máximos (`H33`)**:
   - Se definen tokens/variables canónicas de layout en los estilos comunes (por ejemplo: formulario/estrecho `480px` / `30rem`, contenido estándar `1280px` / `80rem`, tablero/ancho extendido `1440px` / `90rem`).
   - Las pantallas principales adoptan estos anchos canónicos en sustitución de las medidas arbitrarias dispersas.
5. **Home operativo integrado y con distribución adecuada (`H35`)**:
   - La pantalla de inicio (`/`) se integra al flujo general del layout sin forzar un centrado de columna angosta de 416 px con `min-height: 100vh`, distribuyendo la sesión, el diagnóstico de salud y los accesos rápidos de manera legible y equilibrada.
6. **Calidad y verificación técnica**:
   - Los comandos de verificación (`npm run lint`, `npm run build` y `npm test`) finalizan con éxito sin regresiones en las pruebas existentes.

## Fuera de alcance

- Modificaciones de tokens de diseño o contrastes de color WCAG AA correspondientes a PLAN-25 y PLAN-28.
- Traducción y unificación de códigos de estado de visitas correspondientes a PLAN-29.
- Cambios en los flujos o diálogos de asignación de operadores correspondientes a PLAN-27.
- Modificaciones en `backend` o `frontend` móvil.

## Preguntas abiertas

Ninguna
