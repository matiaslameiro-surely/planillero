# Plan técnico — PLAN-56

## Enfoque

- Estado `showPassword` (arranca en `false`); el `TextInput` usa `secureTextEntry={!showPassword}`.
- El campo pasa a un contenedor en fila con el borde y el fondo del input actual: el `TextInput`
  ocupa el resto (`flex: 1`, sin borde propio) y a la derecha va un `Pressable` con el texto
  «Mostrar» / «Ocultar».
- El `Pressable` tiene `minWidth` y `minHeight` de `MIN_TOUCH_TARGET`, `accessibilityRole="button"` y
  `accessibilityLabel` según el estado. Colores de `useThemeColors` (`primary` para el texto).

## Archivos a tocar

### frontend/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/login.tsx` | modificar | Estado, contenedor del campo y botón de alternar |
| `src/app/login.test.tsx` | modificar | Casos de los criterios 1 a 5 |

Total: 2 archivos.

## Decisiones técnicas

- **Texto y no ícono:** sin dependencia nueva (no hay `@expo/vector-icons` instalado) y con un
  nombre accesible explícito.
- **El botón dentro del borde del campo:** es lo que pide el issue («en el extremo derecho del
  campo») y es el patrón que el usuario reconoce.
- **No se toca el contenedor de la pantalla:** lo cambió PLAN-55, y así el diff queda acotado al
  campo.

## Supuestos

- `react-native-web` está instalado (`npm run web`), así que la pantalla se puede probar en Chrome.

## Cómo se prueba

1. Tests en `login.test.tsx` con `react-test-renderer`, como los de PLAN-55.
2. `node .agents/scripts/verificar.mjs --tarea PLAN-56`.
3. En Chrome con Expo web: escribir la contraseña, alternar y ver el texto y el tipo del campo.
