# PLAN-53 — Móvil: aplicar SafeAreaView / insets superiores en Hoja de Ruta para evitar solapamiento con la barra de estado

## Contexto y problema

En la aplicación móvil (`planillero-frontend`), la navegación principal se configuró en `src/app/_layout.tsx` con la opción `headerShown: false` para permitir cabeceras personalizadas en cada pantalla.

Sin embargo, en la pantalla de Hoja de Ruta (`src/app/agenda.tsx`), el encabezado `DeviceStatusBar` se renderiza directamente en la coordenada superior `y=0` sin considerar los insets de la barra de estado del sistema operativo (reloj, nivel de batería, iconos de red) ni el notch o cámara frontal del dispositivo móvil. Esto provoca una colisión visual directa entre los indicadores del sistema y los componentes de estado de la aplicación («Modo conectado/offline», nivel de batería, estado del GPS y visitas pendientes), tornando los elementos difíciles o imposibles de leer o interactuar.

## Alcance

**Repos que toca:** `frontend`

- `frontend/src/app/agenda.tsx` (y opcionalmente `frontend/src/app/_layout.tsx` si se requiere asegurar `SafeAreaProvider`).
- Pruebas unitarias/de componentes asociadas a `agenda.tsx` y su safe area.

## Criterios de aceptación

1. **Margen seguro superior aplicado:** La pantalla de Hoja de Ruta (`agenda.tsx`) incorpora el padding / inset superior de la zona segura (`SafeAreaView` de `react-native-safe-area-context` o `useSafeAreaInsets().top`), evitando que el contenido superior colisione con la barra de notificaciones/estado o notch.
2. **Encabezado `DeviceStatusBar` no colisiona:** Los elementos de `DeviceStatusBar` («Modo conectado / Modo offline», batería, GPS y visitas pendientes) se renderizan completamente por debajo del área del sistema del dispositivo físico.
3. **Consistencia visual y de fondo (Light & Dark Theme):** El área segura superior mantiene el color de fondo correspondiente al tema activo (`colors.bgBackdrop` o fondo de la barra de estado) tanto en tema claro como en tema oscuro, sin generar franjas desalineadas ni inconsistencias de contraste.
4. **Verificación automatizada:** Se incorpora o actualiza una prueba que valide la correcta aplicación del inset / contenedor seguro y la preservación del estilo y estructura en `agenda.tsx`.

## Fuera de alcance

- Modificaciones en otras pantallas que tengan issues propios en el backlog (como PLAN-55 sobre pantalla de Login).
- Modificaciones en el backend (`planillero-backend`) ni en el backoffice web (`planillero-backoffice`).
- Cambios en la lógica de negocio de la agenda, sincronización offline o base de datos SQLite.

## Preguntas abiertas

Ninguna
