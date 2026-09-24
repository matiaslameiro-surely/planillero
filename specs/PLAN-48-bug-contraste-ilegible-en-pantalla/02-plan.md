# Plan técnico — PLAN-48

## Enfoque

Resolver el problema de contraste en Modo Oscuro definiendo un sistema de tokens de tema dual (`LIGHT_THEME` y `DARK_THEME`) en `frontend/src/constants/layout.ts` con un hook reutilizable `useThemeColors()` basado en `useColorScheme()` de React Native.

Se mantendrá `HIGH_CONTRAST_COLORS` (apuntando a `LIGHT_THEME` o como alias) para compatibilidad total con tests existentes. Se actualizarán la pantalla principal (`index.tsx`), las pantallas clave (`login.tsx`, `agenda.tsx`) y los componentes principales (`VisitCard.tsx`) para consumir dinámicamente los colores de tema, asegurando fondos de tarjeta opacos (`bgSurface`), bordes definidos (`borderDefault`), y textos con contraste accesible (WCAG 2.1 AA ratio >= 4.5:1 / 3:1) tanto en modo claro como en modo oscuro.

## Archivos a tocar

### frontend/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/constants/layout.ts` | modificar | Definir `LIGHT_THEME`, `DARK_THEME`, `ThemeColors` y el hook `useThemeColors()`, preservando `HIGH_CONTRAST_COLORS`. |
| `src/constants/layout.test.ts` | modificar | Verificar la estructura de tokens de modo claro y modo oscuro, ratios y resolución. |
| `src/app/index.tsx` | modificar | Integrar `useThemeColors()` en `styles.card` (fondo y borde) y en todos los textos (`title`, `subtitle`, `label`, `statusText`, `reason`, `url`). |
| `src/app/login.tsx` | modificar | Aplicar `useThemeColors()` para títulos, subtítulos, inputs y tarjeta adaptativa al tema. |
| `src/app/agenda.tsx` | modificar | Aplicar `useThemeColors()` para títulos, subtítulo de fecha, estado de sync y avisos legibles en modo oscuro. |
| `src/components/VisitCard.tsx` | modificar | Aplicar fondo de tarjeta (`bgSurface`), borde (`borderDefault`) y textos contrastantes (`textPrimary`, `textSecondary`, `textMuted`). |
| `src/components/__tests__/themeContrast.test.tsx` | crear | Tests unitarios dedicados a verificar legibilidad, contraste y renderizado en modo claro y modo oscuro. |

## Decisiones técnicas

- **Tokens temáticos en `src/constants/layout.ts` con hook `useThemeColors()`** — Se descartó incorporar librerías externas de theming (como styled-components o unistyles) porque el proyecto utiliza React Native estándar con Expo, y `useColorScheme()` nativo junto a StyleSheet/inline-theme resuelve el problema con cero dependencias nuevas y mínima sobrecarga.
- **Preservar `HIGH_CONTRAST_COLORS` como referencia a `LIGHT_THEME`** — Se descartó eliminar o renombrar `HIGH_CONTRAST_COLORS` porque rompería los tests de campo de ergonomía existentes (`ergonomics.test.tsx`). Se amplía la interfaz exportando también `DARK_THEME`, `LIGHT_THEME` y `useThemeColors()`.
- **Fondo de tarjeta explícito (`bgSurface`) con bordes sutiles** — Se descartó dejar la tarjeta transparente con solo borde en modo oscuro, ya que sobre fondos oscuros o con elementos adyacentes la legibilidad de superficie requiere una diferenciación clara de elevación/capa (`#1e293b` sobre `#0f172a`).

## Supuestos

- `useColorScheme()` de `react-native` provee confiablemente `'light' | 'dark' | null | undefined` en Expo / React Native.
- No hay supuestos marcados `RIESGO`.

## Cómo se prueba

- `npm test` en `frontend` ejecutando todas las suites de prueba existentes.
- Tests unitarios en `layout.test.ts` validando la presencia y valores de tokens temáticos.
- Nueva suite `src/components/__tests__/themeContrast.test.tsx` validando renderizado de `index.tsx`, `agenda.tsx` y `VisitCard` bajo `useColorScheme` en `'dark'` y `'light'`.
- Chequeo de tipos TypeScript con `npx tsc --noEmit` y linter con `npm run lint`.
