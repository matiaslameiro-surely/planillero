# Plan técnico — PLAN-57

## Enfoque

`DeviceStatusBar` pasa a usar `useThemeColors()`, igual que `agenda.tsx`, `index.tsx`, `login.tsx` y
`VisitCard.tsx` desde PLAN-48. Los colores del tema se aplican en línea sobre los estilos estáticos,
que es el patrón de esos archivos:

- `bar` → `backgroundColor: colors.bgBackdrop`, el mismo fondo que hoy le da `agenda.tsx`, así que no
  cambia nada a la vista. `borderBottomColor: colors.borderDefault` en vez de `#8888`.
- `item` → `color: colors.textSecondary`. Da 12.02:1 en oscuro y 9.90:1 en claro.
- `itemWarning` → `color: colors.danger`. Da 4.74:1 en oscuro y 6.18:1 en claro; hoy el rojo fijo
  `#c0392b` da 3.28:1 en oscuro.

- `modeOnline` → `#15803d` en vez de `#1a9e5c`: el texto blanco pasa de 3.45:1 a 5.02:1. Es el
  `success` del tema claro, pero queda fijo en los dos temas porque el chip lleva su propio fondo. El
  `success` oscuro (`#22c55e`) con texto blanco no llega al mínimo. `modeOffline` (5.44:1) no cambia.

## Archivos a tocar

### frontend/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/components/DeviceStatusBar.tsx` | modificar | Colores del tema para el fondo, el borde, los textos y el aviso; verde del chip «Modo conectado» |
| `src/components/DeviceStatusBar.test.tsx` | modificar | Tests por tema: colores aplicados y contraste ≥ 4.5:1 contra el fondo de la barra |
| `src/constants/contrast.ts` y `contrast.test.ts` | crear | Cálculo de contraste WCAG compartido por los tests |
| `src/components/__tests__/themeContrast.test.tsx` | modificar | Usa el helper compartido en vez de su copia local |

## Decisiones técnicas

- **`textSecondary` para los textos informativos.** Se descartó `textPrimary` porque la barra es
  información secundaria respecto del contenido de la pantalla. `textSecondary` ya supera ampliamente
  4.5:1 en los dos temas. También se descartó `textMuted`, porque en claro da 4.55:1 sobre
  `bgBackdrop`: queda justo en el límite.
- **Fondo propio en la barra.** Se descartó dejarla transparente, porque el contraste dependería de
  cada pantalla que la use, y el criterio pide medirlo contra el fondo de la barra.
- **Tests de contraste en el test del componente, con un helper compartido.** Se descartó sumar casos
  a `__tests__/themeContrast.test.tsx`, porque ese archivo prueba los tokens y las pantallas. La
  fórmula de WCAG vive en `src/constants/contrast.ts` (acepta `#rgb` y `#rrggbb`) y la usan los dos
  archivos de tests. Primero se había repetido en el test del componente; la revisión 1 marcó la
  duplicación y se extrajo. No va en una carpeta `__tests__` porque el preset de Jest toma como suite
  todo lo que hay ahí.
- **El chip usa `LIGHT_THEME.success` y `LIGHT_THEME.textInverse`, no literales.** Así el verde no se
  desalinea del token del que sale. El test lo encuentra por `testID` en vez de recorrer el árbol.

## Supuestos

- `jest.mock('react-native/Libraries/Utilities/useColorScheme')` sirve para forzar el tema en el
  test del componente, igual que en `themeContrast.test.tsx`.
- Ninguna pantalla depende de que la barra sea transparente: hoy sólo la usa `agenda.tsx`, con el
  mismo `bgBackdrop`.

Ninguno es `RIESGO`.

## Cómo se prueba

- `DeviceStatusBar.test.tsx`, en tema claro y en tema oscuro:
  - el fondo de la barra es `bgBackdrop` del tema (criterio 4);
  - batería, GPS listo y visitas pendientes usan `textSecondary` y dan ≥ 4.5:1 contra ese fondo
    (criterios 1 y 2);
  - el aviso del GPS usa `danger`, en negrita, y da ≥ 4.5:1 (criterio 3);
  - los chips «Modo conectado» y «Modo offline» dan ≥ 4.5:1 entre texto y fondo (criterio 5).
- `node .agents/scripts/verificar.mjs --tarea PLAN-57` (criterio 7).
