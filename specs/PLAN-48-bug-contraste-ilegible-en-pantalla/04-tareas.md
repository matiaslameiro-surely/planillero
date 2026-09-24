# Tareas — PLAN-48

## frontend *(app móvil)*

- [x] `[frontend]` Definir `LIGHT_THEME`, `DARK_THEME`, tipo `ThemeColors` y hook `useThemeColors()` en `src/constants/layout.ts`, preservando `HIGH_CONTRAST_COLORS`.
- [x] `[frontend]` Actualizar y ampliar tests en `src/constants/layout.test.ts` para verificar la paleta claro/oscuro.
- [x] `[frontend]` Integrar `useThemeColors()` en `src/app/index.tsx` asegurando `backgroundColor` y `borderColor` en tarjetas, y colores contrastantes en todos los textos (`title`, `subtitle`, `label`, `statusText`, `reason`, `url`, `HealthIndicator`).
- [x] `[frontend]` Integrar `useThemeColors()` en `src/components/VisitCard.tsx` asegurando fondo, bordes y textos contrastantes.
- [x] `[frontend]` Integrar `useThemeColors()` en `src/app/login.tsx` y `src/app/agenda.tsx` asegurando consistencia de colores de texto y fondo.
- [x] `[frontend]` Crear suite `src/components/__tests__/themeContrast.test.tsx` para verificar renderizado y contraste accesible en modo oscuro y claro.

## Verificación

- [x] Gates en verde en los repos del alcance (`node .agents/scripts/verificar.mjs`)
- [x] Revisión independiente sin hallazgos `critical` ni `high`
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto
