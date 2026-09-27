# Tareas — PLAN-71

- [ ] [backoffice] `auth.service.ts`: estado `unreachable` y limpieza sólo ante 4xx en `ensureSession()` y `refresh()`
- [ ] [backoffice] Tests de `auth.service.spec.ts`: 401/400 descartan; 502/503/red conservan
- [ ] [backoffice] `session-redirect.ts` y las cuatro guardas usándolo
- [ ] [backoffice] Tests de las guardas con `unreachable`
- [ ] [backoffice] Pantalla `server-unavailable` y ruta `sin-conexion`
- [ ] [backoffice] Tests de la pantalla (éxito, rechazo, sigue caído, `volver` inválido)
- [ ] [backoffice] Gates (`verificar.mjs`) y prueba manual: backend caído → F5 → pantalla → backend arriba → Reintentar → sesión restaurada
