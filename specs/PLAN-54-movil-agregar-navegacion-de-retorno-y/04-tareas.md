# Tareas — PLAN-54

## frontend *(app móvil)*

- [x] `[frontend]` Actualizar `src/app/agenda.tsx` agregando barra de navegación superior con botón de retorno (`router.canGoBack() ? back() : replace('/')`) y botón de cierre de sesión (`confirmSignOut` + `signOut`).
- [x] `[frontend]` Asegurar estilos ergonómicos (`MIN_TOUCH_TARGET = 48`, padding, colores temáticos con `useThemeColors`) y etiquetas de accesibilidad (`accessibilityRole="button"`, `accessibilityLabel`).
- [x] `[frontend]` Crear `src/app/__tests__/agenda.test.tsx` con pruebas automatizadas para los controles de retorno, logout, confirmación y dimensiones ergonómicas mínimas.

## Verificación

- [x] Gates en verde en los repos del alcance (`node .agents/scripts/verificar.mjs`)
- [x] Revisión independiente sin hallazgos `critical` ni `high`
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto
