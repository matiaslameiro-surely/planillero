# Tareas — PLAN-15

Checklist en orden de dependencia. No hay contrato de API (ver `02-plan.md`): la tarea es de
infraestructura y los clientes no dependen de endpoints nuevos. El backend va primero porque el
compose integral vive ahí y referencia los `Dockerfile` de los otros dos repos.

## backend

- [x] `[backend]` `.gitattributes`: `*.sh text eol=lf`; `.gitignore`: asegurar `.env` ignorado
- [x] `[backend]` `.dockerignore` y `Dockerfile` multi-stage (Temurin 21, no root, caché de deps)
- [x] `[backend]` `.env.example` con todas las variables (valores ficticios)
- [x] `[backend]` `docker-compose.yml` integral: postgres, minio, minio-init, backend, backoffice,
      red `planillero-net`, volúmenes, healthchecks y `depends_on: service_healthy`
- [x] `[backend]` `scripts/verify-compose.sh` (levanta, espera `healthy`, `curl`, baja)
- [x] `[backend]` README: cómo levantar, variables, script de verificación

## frontend *(app móvil)*

- [x] `[frontend]` `.dockerignore` y `docker/Dockerfile.apk` (Android SDK + `expo prebuild` + Gradle)
- [x] `[frontend]` `scripts/build-apk.sh` que recibe `EXPO_PUBLIC_API_URL` y copia el APK
- [x] `[frontend]` README: sección "Generar el APK con Docker"

## backoffice *(web)*

- [x] `[backoffice]` `environment.docker.ts` (`apiUrl: ''`) y configuración `docker` en `angular.json`
- [x] `[backoffice]` `docker/nginx.conf` (gzip, headers de seguridad, SPA, proxy, `error_page`)
- [x] `[backoffice]` páginas de error `404.html`, `502.html`, `503.html`
- [x] `[backoffice]` `.dockerignore` y `Dockerfile` (Node 24 → nginx-unprivileged)
- [x] `[backoffice]` README: sección Docker

## Verificación

- [x] Docker Desktop corriendo; `docker compose config` sin errores
- [x] Los cuatro servicios en `healthy` y `verify-compose.sh` en verde (y en rojo si se rompe algo)
- [ ] Gates en verde en los repos del alcance (`node .agents/scripts/verificar.mjs --tarea PLAN-15`) — **8 de 9 pasos en verde; el lint del frontend falla también en `main`, ver `06-verificacion-frontend-lint-preexistente.md`**
- [x] Revisión independiente sin hallazgos `critical` ni `high`
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto (o declarado «no verificado»)
