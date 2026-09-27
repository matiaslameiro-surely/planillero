# Tareas — PLAN-36

## backend

- [x] `[backend]` Adaptar `application.properties` para soportar `app.jwt.private-key` y `app.jwt.public-key` apuntando a `/app/keys/*.pem` (con fallback a efímeras si el recurso no existe).
- [x] `[backend]` Crear `backend/docker-compose.prod.yml` con los servicios `postgres`, `backend` y `backoffice` en la red `planillero-prod-net`, integración con Traefik (red externa y etiquetas `Host`, `entrypoints`, `certresolver`), volúmenes de datos y hardening.
- [x] `[backend]` Crear `backend/.env.production.example` con la documentación de secretos de producción.
- [x] `[backend]` Crear `backend/scripts/generate-jwt-keys.sh` para generar el par de claves RSA 2048 y secreto HMAC.
- [x] `[backend]` Crear `backend/scripts/verify-deployment.sh` para validar la URL de producción, endpoint `/health` y credenciales de demo.
- [x] `[backend]` Crear `backend/DEPLOY_HOSTINGER.md` con la guía de despliegue paso a paso en Hostinger VPS con Docker Manager.
- [x] `[backend]` Emitir `03-contrato-api.md` (no agrega nuevos endpoints, ratifica `/health` y `/api/v1/auth/login`).

## backoffice *(web)*

- [x] `[backoffice]` Leer `03-contrato-api.md` antes de empezar.
- [x] `[backoffice]` Modificar `docker/nginx.conf` para mapear y reenviar `X-Forwarded-Proto` y `X-Forwarded-For` de forma segura tras proxies con terminación TLS.

## Verificación

- [x] Gates en verde en los repos del alcance (`node .agents/scripts/verificar.mjs --tarea PLAN-36`).
- [x] Revisión independiente sin hallazgos `critical` ni `high` (`node .agents/scripts/revisar.mjs`).
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto.
