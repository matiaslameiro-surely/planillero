# PLAN-73 — Backoffice: mejoras menores detectadas en la prueba del 27/09

## Contexto y problema

Durante las pruebas de teclado, tamaños de pantalla y resiliencia del backoffice realizadas el 27/09, se detectaron tres oportunidades de mejora que no rompen funcionalidad pero afectan la experiencia de uso:

1. **Mensaje técnico en login con backend caído:** Cuando el backend no responde (por ejemplo HTTP 502 / 503 / 504 o error de conexión status 0), la pantalla de login muestra un mensaje técnico: `«No se pudo completar la operación (502).»`. Se requiere un mensaje comprensible y amigable para las personas, por ejemplo `«No se puede conectar con el servidor. Probá de nuevo en unos minutos.»`.
2. **Enter no verifica en Auditoría:** En la sección «Auditar Integridad de Visita» de la pantalla de auditoría, al presionar `Enter` en el campo de entrada «ID o código de visita», no se dispara la verificación (sólo funciona haciendo clic en el botón). Se requiere que `Enter` en dicho input ejecute la verificación de integridad.
3. **Tablas que desbordan horizontalmente en pantallas estrechas (390px):** En pantallas pequeñas como las de celulares (390 px de ancho), las tablas de datos de Planificación y de Auditoría se desbordan horizontalmente provocando scroll lateral en toda la página (292 px y 132 px de desborde). Deben tener un contenedor con desplazamiento horizontal propio (`overflow-x: auto`) para que el scroll quede confinado a la grilla y la página no se rompa horizontalmente.

## Alcance

**Repos que toca:** `backoffice`

## Criterios de aceptación

1. **Mensaje de login ante indisponibilidad del backend:** Cuando el login falla por error de conexión o indisponibilidad del servidor (status 0, 502, 503, 504) sin mensaje específico en el payload, la pantalla de login muestra un mensaje en español sin códigos numéricos de status HTTP: «No se puede conectar con el servidor. Probá de nuevo en unos minutos.». Si el backend devuelve un payload con un campo `message` (por ejemplo error 400/401 con mensaje de negocio), dicho mensaje se respeta.
2. **Acción de tecla Enter en verificación de auditoría:** Al presionar `Enter` en el input «ID o código de visita» del formulario de «Auditar Integridad de Visita», se ejecuta la acción de auditar integridad exactamente igual que al hacer clic en el botón.
3. **Desplazamiento horizontal contenido en grillas (390px):** Las secciones con tablas de Planificación (`.planificacion__grid`) y Auditoría (`.auditoria__grid`) permiten desplazamiento horizontal interno (`overflow-x: auto; max-width: 100%;`) evitando que la página entera desborde horizontalmente a 390 px de ancho.
4. **Verificación y suite en verde:** Se agregan o actualizan tests unitarios para las tres mejoras donde corresponda y todos los gates de verificación del backoffice pasan en verde.

## Fuera de alcance

- Cambios en el backend o en el frontend móvil.
- Rediseño de componentes de auditoría o planificación más allá de la contención horizontal del scroll y el evento `Enter`.
- Modificación de los contratos de API existentes.

## Preguntas abiertas

Ninguna.
