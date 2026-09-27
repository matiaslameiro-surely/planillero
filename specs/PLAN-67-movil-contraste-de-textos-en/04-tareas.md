# Tareas — PLAN-67

## frontend *(app móvil)*

- [x] `[frontend]` Actualizar `src/components/LocationSummary.tsx` incorporando `useThemeColors()` para asignar `borderDefault` y `textSecondary`.
- [x] `[frontend]` Actualizar `src/components/SyncQueueBanner.tsx` fijando el fondo de `styles.done` en `#15803d` (`LIGHT_THEME.success`).
- [x] `[frontend]` Extender `src/components/LocationSummary.test.tsx` con pruebas WCAG 2.1 AA por tema (claro/oscuro) usando `contrastRatio`.
- [x] `[frontend]` Extender `src/components/SyncQueueBanner.test.tsx` con prueba de contraste WCAG 2.1 AA para `doneText` y `done`.

## Verificación

- [x] Gates en verde en frontend (`node .agents/scripts/verificar.mjs --tarea PLAN-67`)
- [x] Revisión independiente sin hallazgos `critical` ni `high`
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto
