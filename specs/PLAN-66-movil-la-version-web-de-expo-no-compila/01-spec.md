# PLAN-66 — Móvil: la versión web de Expo no compila por el .wasm de expo-sqlite

## Contexto y problema

Al ejecutar la aplicación móvil en entorno web mediante `npm run web` (`expo start --web`), el servidor de desarrollo levanta pero cualquier petición responde con error 500. Metro falla al empaquetar el worker web de `expo-sqlite` con el siguiente error:

```
Metro error: Unable to resolve module ./wa-sqlite/wa-sqlite.wasm
  from node_modules/expo-sqlite/web/worker.ts
AssertionError: Worker chunk not found for: node_modules/expo-sqlite/web/worker.ts
```

La versión web es indispensable para inspeccionar visualmente pantallas y componentes en Chrome sin depender permanentemente de un emulador de Android o compilar un APK en cada cambio. Además, los tests con `react-test-renderer` sólo verifican props y estilos pero no el renderizado visual real.

El problema radica en la ausencia de una configuración personalizada de Metro (`metro.config.js`) que incluya la extensión `wasm` dentro de `resolver.assetExts`, y potencialmente el manejo de headers necesarios para SharedArrayBuffer (COOP/COEP) o particularidades del empaquetado web en Expo.

## Alcance

**Repos que toca:** `frontend`

## Criterios de aceptación

1. `metro.config.js` está configurado en `frontend/` extendiendo `getDefaultConfig(__dirname)` de `@expo/metro-config` para soportar assets `.wasm` en el resolver de Metro.
2. `npm run web` (o `npx expo export --platform web`) empaqueta y sirve la aplicación web sin errores 500, permitiendo visualizar la pantalla de Login en el navegador web.
3. La configuración no afecta negativamente la compilación ni el bundling nativo de Android (`npx expo export --platform android` o build nativo siguen funcionando igual).
4. El archivo `README.md` del frontend documenta cómo levantar y probar la aplicación en modo web, detallando las limitaciones conocidas en la plataforma web (por ejemplo, comportamiento de `expo-sqlite`, `expo-secure-store` o almacenamiento local en navegador frente a SQLite nativo cifrado).
5. Todos los gates determinísticos del frontend (`npm test`, `npm run lint`, `tsc --noEmit`) pasan en verde.

## Fuera de alcance

- Reemplazar `expo-sqlite` por otro motor de persistencia.
- Implementar soporte completo de base de datos cifrada (SQLCipher) en web si el driver nativo no lo soporta en navegador; sólo se requiere que la app cargue y renderice pantallas en web.
- Cambios en el backend o en el backoffice.

## Preguntas abiertas

Ninguna.
