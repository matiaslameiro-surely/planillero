# Plan técnico — PLAN-66

## Enfoque

Se resuelve el fallo de empaquetado web en Metro (`npm run web`) creando el archivo `metro.config.js` en `frontend/`. La configuración extiende `getDefaultConfig(__dirname)` provista por `@expo/metro-config`, agrega la extensión `wasm` a `resolver.assetExts` para que Metro pueda resolver el binario `wa-sqlite.wasm` consumido por el worker web de `expo-sqlite`, y configura las cabeceras `Cross-Origin-Opener-Policy` y `Cross-Origin-Embedder-Policy` en el middleware del servidor de desarrollo para habilitar `SharedArrayBuffer`.

Adicionalmente, se actualiza `frontend/README.md` documentando cómo ejecutar la app en web y explicando las características y limitaciones en navegador (uso de `wa-sqlite` en lugar de SQLCipher nativo cifrado, y almacenamiento seguro en memoria para tokens en navegador).

## Archivos a tocar

### frontend/

| Archivo | Acción | Para qué |
|---|---|---|
| `frontend/metro.config.js` | crear | Configurar Metro para resolver archivos `.wasm` como assets y configurar headers COOP/COEP para soporte de `SharedArrayBuffer` en web. |
| `frontend/README.md` | modificar | Documentar la ejecución en web (`npm run web`), verificación de renderizado en Chrome y limitaciones del entorno web frente a la app nativa. |

## Decisiones técnicas

- **Incorporar `wasm` en `resolver.assetExts` y headers COOP/COEP en `server.enhanceMiddleware`** — Se descartó crear mocks o archivos alternativos `.web.ts` para deshabilitar `expo-sqlite` en web porque `expo-sqlite` ya incluye soporte web oficial mediante `wa-sqlite` y Web Workers; la causa del error 500 era exclusivamente la falta del asset `.wasm` en la configuración de Metro.
- **Usar `Cross-Origin-Embedder-Policy: credentialless`** — Se descartó `require-corp` porque `credentialless` permite cargar recursos externos sin necesidad de headers CORP específicos mientras satisface el aislamiento requerido para `SharedArrayBuffer`.

## Supuestos

- Los navegadores modernos (Chrome, Firefox, Safari) soportan WebAssembly y Workers para la ejecución de `wa-sqlite`.
- En web, la persistencia de SQLite opera mediante el worker de `wa-sqlite` (almacenamiento en navegador), mientras que SQLCipher con cifrado respaldado por hardware es exclusivo de plataformas nativas Android/iOS.
- Ninguno con `RIESGO`.

## Cómo se prueba

1. Ejecutar `npx expo export --platform web --clear` comprobando que genera el bundle web y los chunks del worker sin errores.
2. Iniciar el servidor web con `npm run web` (o `npx expo start --web`) comprobando que responde con código 200 y no 500 al solicitar la página y assets.
3. Ejecutar `npx expo export --platform android --clear` verificando que el bundling nativo de Android no presenta regresiones.
4. Ejecutar gates del frontend: `npm run lint`, `npx tsc --noEmit` y `npm test -- --watchAll=false`.
