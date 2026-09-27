# Tareas — PLAN-66

## frontend *(app móvil)*

- [x] `[frontend]` Crear `frontend/metro.config.js` extendiendo `getDefaultConfig(__dirname)` con extensión `wasm` en `resolver.assetExts` y middleware con headers COOP/COEP.
- [x] `[frontend]` Actualizar `frontend/README.md` documentando ejecución y prueba en web, junto con las particularidades de almacenamiento en navegador frente al entorno nativo.

## Verificación

- [x] `[frontend]` Validar empaquetado web con `npx expo export --platform web --clear`
- [x] `[frontend]` Validar empaquetado Android con `npx expo export --platform android --clear`
- [x] Gates en verde en los repos del alcance (`node .agents/scripts/verificar.mjs --tarea PLAN-66`)
- [x] Revisión independiente sin hallazgos `critical` ni `high`
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto
