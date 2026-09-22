# PLAN-16 — Auditoría UX Móvil: Evaluación Ergonómica de Campo y Heurísticas de Nielsen

## Contexto y problema

La aplicación móvil de Planillero (`planillero-frontend`) está diseñada para ser utilizada por operadores e inspectores en territorio sobre tablets institucionales Android de 10'' con conectividad LTE intermitente. Los operadores realizan relevamientos bajo condiciones ambientales adversas: luz solar directa, deslumbramiento, lluvia o polvo, y frecuentemente operan el dispositivo de pie, con una sola mano o utilizando guantes de trabajo industriales.

Hasta el momento se han implementado múltiples módulos funcionales (scaffolding inicial, agenda offline en SQLite, captura GPS con doble timestamp, formularios dinámicos JSON Schema, captura de evidencias con firma digital SHA-256 y sincronización en cola). Sin embargo, no se ha llevado a cabo una evaluación formal de usabilidad y ergonomía de campo que verifique el cumplimiento estricto de las 10 Heurísticas de Jakob Nielsen, las pautas de accesibilidad WCAG 2.1 bajo luz solar y los estándares de ergonomía física (targets táctiles mínimos de 48x48 dp para manipulación con guantes).

Esta tarea tiene como objetivo auditar de forma integral la UX/UI de la aplicación móvil según la Sección 5 de la rúbrica institucional del proyecto, aplicar mejoras concretas en el código de la app para subsanar los puntos críticos ergonómicos detectados, implementar pruebas unitarias que garanticen de forma continua las dimensiones mínimas de interacción táctil, y documentar el informe pericial de auditoría con registro de pruebas con usuario real de campo.

## Alcance

**Repos que toca:** `frontend` (móvil)

## Criterios de aceptación

### 1. Documento de Auditoría UX y Evaluación Ergonómica de Campo
1.1. Se elabora el documento exhaustivo de auditoría en `frontend/docs/AUDITORIA_UX_MOVIL.md` estructurado según la Sección 5 de la rúbrica del proyecto:
- **Evaluación Heurística de Jakob Nielsen:** Evaluación pormenorizada de las 10 heurísticas en los flujos principales (Login, Hoja de Ruta, Inicio GPS, Formulario Dinámico, Firma Ológrafa y Registro de Evidencias), calificando cumplimiento (Sí / Parcial / No) y detallando evidencias técnicas:
  - *H1 (Visibilidad del estado del sistema):* Barra superior fija `DeviceStatusBar` (online/offline, batería, semáforo GPS, contador de visitas) y banner de sincronización `SyncQueueBanner`.
  - *H2 (Coincidencia entre sistema y mundo real):* Vocabulario operativo de campo, coordenadas legibles en `LocationSummary`, semáforo de precisión GPS por distancias métricas.
  - *H3 (Control y libertad del usuario):* Limpieza y reintento en lienzo de firma `SignaturePad`, descarte y previsualización de fotos en bandeja antes de sellar.
  - *H4 (Consistencia y estándares):* Patrones visuales homogéneos, estados de visita estandarizados (`PENDING`, `ASSIGNED`, `IN_PROGRESS`, etc.).
  - *H5 (Prevención de errores):* Bloqueo de inicio de visita sin GPS o sin conexión, advertencias en cola offline antes de cerrar sesión, validación reactiva campo por campo en formularios.
  - *H6 (Reconocimiento antes que recuerdo):* Información contextual en tarjetas de visita (`VisitCard`), guía visual en el lienzo de firma, leyendas explicativas en estados.
  - *H7 (Flexibilidad y eficiencia de uso):* Acciones primarias directas con un solo toque, navegación simplificada en columna única para tablets.
  - *H8 (Diseño estético y minimalista):* Pantallas sobrias sin sobrecarga cognitiva ni elementos superfluos, priorizando áreas útiles de trabajo.
  - *H9 (Ayuda para reconocer y recuperarse de errores):* Mensajes claros sin tecnicismos ("No se pudo conectar con el servidor", "Precisión baja"), sin revelar datos sensibles en autenticación.
  - *H10 (Ayuda y documentación):* Indicaciones inline y placeholders descriptivos en campos de formulario y guías de uso.
- **Evaluación Ergonómica para el Operador de Campo:**
  - *Targets táctiles:* Verificación de que todos los controles interactivos primarios y secundarios posean dimensiones mínimas de 48x48 dp recomendadas por Material Design y WCAG para interacción con guantes o dedos gruesos.
  - *Contraste WCAG bajo luz solar directa:* Verificación de ratios de contraste tipográfico (mínimo 4.5:1 para texto normal, 3:1 para títulos grandes y controles activos) con paleta optimizada para visión diurna de alto brillo.
  - *Operabilidad con una mano:* Disposición de controles primarios al alcance del pulgar o en zonas ergonómicas accesibles en tablet de 10''.
- **Registro de Pruebas con Usuario Real de Campo:**
  - Registro de sesión de prueba con operador real/inspector simulando un turno en territorio.
  - Métricas de tarea: tiempo de resolución, tasa de éxito y reporte de feedback cualitativo y cuantitativo.

### 2. Remediación Ergonómica y de Accesibilidad en el Frontend
2.1. Centralización de tokens ergonómicos en `src/constants/layout.ts` (o módulo de diseño) con constante `MIN_TOUCH_TARGET = 48` y estilos de alto contraste.
2.2. En `src/app/login.tsx`:
- Los campos de texto `TextInput` y los botones de acción ("Entrar", "Verificar") garantizan una altura mínima de 48 dp (`minHeight: 48`).
- Se configuran etiquetas y roles de accesibilidad explícitos (`accessibilityLabel`, `accessibilityRole`).
2.3. En `src/forms/DynamicForm.tsx` y `src/forms/fields/`:
- El botón de envío y los selectores / chips de opciones garantizan altura táctil mínima de 48 dp.
- Se asegura contraste tipográfico en labels e inputs bajo luz solar (texto oscuro `#1a202c`, bordes nítidos `#a0aec0`).
2.4. En `src/components/SignaturePad.tsx`:
- Los botones de acción ("Limpiar trazo", "Cancelar", "Confirmar firma") cuentan con `minHeight: 48` y espaciado ergonómico para pulsación con guantes.
2.5. En `src/app/evidence/[visitId].tsx`:
- Los botones de captura, subida y sellado cuentan con `minHeight: 48` y feedback táctil claro.
2.6. En `src/app/formulario.tsx`:
- Corrección del acceso a parámetros URL adaptado a Expo Router para evitar dependencias web (`window.location`), asegurando funcionamiento nativo robusto.

### 3. Testing Automatizado y Verificación
3.1. Se agregan pruebas unitarias específicas de ergonomía y accesibilidad (`src/components/__tests__/ergonomics.test.tsx` o en tests de componentes correspondientes) validando que los componentes clave respeten la constante `MIN_TOUCH_TARGET = 48` y provean accesibilidad.
3.2. La suite completa de tests de Jest pasa en verde (`npm test`).
3.3. Chequeo de tipos (`npx tsc --noEmit`) y linter (`npm run lint`) pasan con 0 errores y 0 advertencias.
3.4. El script del harness `node .agents/scripts/verificar.mjs --tarea PLAN-16` pasa exitosamente.

## Fuera de alcance

- Modificaciones en los esquemas de base de datos de backend (`PostgreSQL`) o en la lógica de negocio de la API.
- Modificaciones en el frontend web (`backoffice` Angular), el cual es objeto de su propia tarea de auditoría (`PLAN-18`).
- Soporte para periféricos de hardware externos adicionales (ej. lectores biométricos ópticos, pospuestos a tareas Post-MVP).

## Preguntas abiertas

Ninguna.
