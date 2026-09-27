# PLAN-67 — Móvil: contraste de textos en LocationSummary y SyncQueueBanner

## Contexto y problema

Durante la resolución de PLAN-57 (que corrigió el contraste en `DeviceStatusBar`), se detectaron dos componentes en la aplicación móvil con problemas de contraste de texto que incumplen el estándar WCAG 2.1 AA (mínimo 4.5:1 para texto normal):

1. En `src/components/LocationSummary.tsx`, los textos descriptivos de latitud, longitud, precisión e inicio usan el estilo `styles.row`, el cual define únicamente `fontSize: 15` sin asignar ningún `color`. En plataformas móviles como Android, esto hace que el texto se pinte por defecto en color negro. Al renderizarse dentro de `VisitCard` en tema oscuro (donde el fondo de superficie de la tarjeta es `bgSurface = #1e293b`), los textos quedan prácticamente invisibles e ilegibles. Asimismo, el borde del contenedor utiliza un gris fijo con canal alfa (`#8888`) en lugar de adaptarse al borde temático.
2. En `src/components/SyncQueueBanner.tsx`, el banner de confirmación «✓ Todo sincronizado» utiliza texto blanco (`#fff`) sobre fondo verde `#1a9e5c`. Esta combinación presenta una relación de contraste de 3.45:1, por debajo del umbral mínimo de accesibilidad WCAG AA de 4.5:1. En PLAN-57 se resolvió la misma situación en el chip de «Modo conectado» adoptando `LIGHT_THEME.success` (`#15803d`), logrando un contraste accesible de 5.02:1.

## Alcance

**Repos que toca:** `frontend` (móvil)

## Criterios de aceptación

1. Los textos de `LocationSummary` (latitud, longitud, precisión e inicio) obtienen su color desde los tokens semánticos de `useThemeColors()` (específicamente `colors.textSecondary` o `colors.textPrimary`) y el borde del contenedor utiliza `colors.borderDefault`.
2. Los textos de `LocationSummary` garantizan una relación de contraste de al menos 4.5:1 contra el fondo de la tarjeta (`bgSurface`), tanto en tema claro (`#ffffff`) como en tema oscuro (`#1e293b`).
3. El banner «✓ Todo sincronizado» en `SyncQueueBanner` garantiza una relación de contraste de al menos 4.5:1 entre el texto y su fondo, utilizando un verde accesible (`#15803d` / `LIGHT_THEME.success`).
4. Existen pruebas unitarias automatizadas por tema (claro y oscuro) que verifican los colores y ratios de contraste WCAG 2.1 (>= 4.5:1) en `LocationSummary` y `SyncQueueBanner`, empleando `src/constants/contrast.ts`.

## Fuera de alcance

- Modificaciones en `backend` o `backoffice`.
- Cambios en otros componentes móviles no señalados en el issue.
- Modificación de la lógica de geolocalización o de encolado/sincronización de actas.

## Preguntas abiertas

Ninguna. Los requerimientos y antecedentes de diseño (PLAN-57) están completamente definidos.
