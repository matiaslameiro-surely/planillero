# Tareas — PLAN-18

## backend

*No participa: el alcance es `backoffice` y la tarea no toca endpoints.*

## frontend *(app móvil)*

*No participa: el issue acota a entorno web de escritorio.*

## backoffice *(web)*

- [x] `[backoffice]` Crear la rama `PLAN-18-auditoria-ux-ui-web-evaluacion` desde `main`
- [x] `[backoffice]` Barrido **Visibilidad del estado del sistema** sobre las ocho pantallas: estados de carga, feedback de acciones, frescura del dato en el tablero, estado de conexión
- [x] `[backoffice]` Barrido **Consistencia y estándares**: paleta, tipografía, nomenclatura de botones y enlaces de regreso, convención de nombres de clases CSS, idioma declarado de la UI
- [x] `[backoffice]` Barrido **Prevención de errores**: confirmaciones en acciones de efecto masivo, validación previa, rangos de fechas, campos deshabilitados
- [x] `[backoffice]` Barrido **Reconocimiento antes que recuerdo**: códigos crudos expuestos al usuario, hashes, IDs, ausencia de navegación persistente y de rastro de ubicación
- [x] `[backoffice]` Barrido **Diseño estético y minimalista con foco en excepciones**: jerarquía visual, densidad, si lo excepcional se distingue de lo normal
- [x] `[backoffice]` Calcular los ratios de contraste WCAG de cada par texto/fondo en uso y armar la tabla con veredicto AA
- [x] `[backoffice]` Verificar el layout a 1920x1080: `max-width`, grillas, breakpoints y tamaños tipográficos mínimos
- [x] `[backoffice]` Escribir `docs/auditoria-ux-ui.md` con resumen ejecutivo, las cinco secciones, contraste, layout y tabla de hallazgos priorizados
- [x] `[backoffice]` Verificar una por una que las citas `archivo:línea` del informe existen y dicen lo que el hallazgo afirma
- [x] `[backoffice]` Commit `PLAN-18: informe de auditoria UX/UI del backoffice`

## Verificación

- [x] Gates en verde en `backoffice` (`node .agents/scripts/verificar.mjs --tarea PLAN-18`)
- [x] Revisión independiente sin hallazgos `critical` ni `high`
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto
