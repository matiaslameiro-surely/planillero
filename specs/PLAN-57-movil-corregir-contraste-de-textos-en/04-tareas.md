# Tareas — PLAN-57

## frontend *(app móvil)*

- [x] `[frontend]` `DeviceStatusBar` usa `useThemeColors()`: fondo `bgBackdrop`, borde `borderDefault`, textos `textSecondary` y aviso del GPS `danger`
- [x] `[frontend]` Chip «Modo conectado» con `#15803d` (5.02:1 con texto blanco)
- [x] `[frontend]` Tests por tema (claro y oscuro): colores aplicados y contraste ≥ 4.5:1 contra el fondo de la barra

- [x] `[frontend]` Revisión 1: helper de contraste compartido, chip con tokens y `testID`

## Verificación

- [x] Gates en verde en los repos del alcance (`node .agents/scripts/verificar.mjs`)
- [x] Revisión independiente sin hallazgos `critical` ni `high`
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto
