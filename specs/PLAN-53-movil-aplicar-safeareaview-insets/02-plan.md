# Plan técnico — PLAN-53

## Enfoque

Para evitar la colisión visual entre el encabezado `DeviceStatusBar` de la pantalla de Hoja de Ruta (`agenda.tsx`) y los elementos de la barra de estado del sistema operativo (reloj, batería, notch/isla dinámica), se configurará `SafeAreaView` de `react-native-safe-area-context` delimitado a los bordes superiores (`edges={['top']}`) en el contenedor raíz de la vista `Agenda`.

Adicionalmente, se asegurará la presencia de `SafeAreaProvider` en el layout raíz (`_layout.tsx`) para garantizar la provisión correcta y homogénea de los insets del sistema a lo largo de toda la aplicación, y se verificará que el color de fondo asignado al contenedor seguro sea `colors.bgBackdrop`, garantizando coherencia cromática y contraste tanto en tema claro como en tema oscuro.

## Archivos a tocar

### frontend/

| Archivo | Acción | Para qué |
|---|---|---|
| `frontend/src/app/_layout.tsx` | modificar | Envolver la raíz de la aplicación con `SafeAreaProvider` para asegurar la provisión de insets seguros en todas las pantallas. |
| `frontend/src/app/agenda.tsx` | modificar | Envolver el contenido de `Agenda` con `SafeAreaView` (`edges={['top']}`) manteniendo el estilo flexible y fondo dinámico (`colors.bgBackdrop`). |
| `frontend/src/app/__tests__/agendaSafeArea.test.tsx` | crear | Probar la inclusión del contenedor `SafeAreaView` con `edges={['top']}` y la coherencia de fondo en modo claro y oscuro. |

## Decisiones técnicas

- **Uso de `SafeAreaView` declarativo con `edges={['top']}` en `agenda.tsx`** — Se descartó aplicar manualmente `paddingTop: insets.top` mediante `useSafeAreaInsets()` porque `SafeAreaView` encapsula de forma nativa y libre de parpadeos (flicker) el ajuste de bordes seguros específicos, delegando al motor de renderizado el respeto estricto del notch o barra de estado en Android e iOS.
- **Montaje explícito de `SafeAreaProvider` en `RootLayout` (`_layout.tsx`)** — Se descartó confiar únicamente en los providers internos automáticos de React Navigation / Expo Router porque la documentación oficial de `react-native-safe-area-context` y Expo prescribe montar `SafeAreaProvider` en el componente raíz para asegurar la disponibilidad consistente de insets en testing y en pantallas sin cabecera nativa (`headerShown: false`).

## Supuestos

- `react-native-safe-area-context` ya se encuentra instalado en dependencias del proyecto (versión `~5.7.0` presente en `package.json`).
- El hook `useThemeColors()` provee el color de fondo general de pantalla (`bgBackdrop`) adaptativo según el esquema activo (`LIGHT_THEME` / `DARK_THEME`).

## Cómo se prueba

1. **Pruebas unitarias de safe area y temas:**
   `npm test -- src/app/__tests__/agendaSafeArea.test.tsx` valida que `agenda.tsx` monte `SafeAreaView` con `edges={['top']}`, que los hijos (incluyendo `DeviceStatusBar`) se ubiquen dentro del contenedor seguro, y que el fondo responda dinámicamente al tema (`bgBackdrop`).
2. **Suite general de frontend:**
   `npm test` en `frontend/` para comprobar que ninguna prueba existente se rompe.
3. **Chequeo de tipos y linter:**
   `npx tsc --noEmit` y `npm run lint` para garantizar código limpio y sin errores tipográficos.
