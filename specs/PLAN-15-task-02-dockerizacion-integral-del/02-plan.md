# Plan técnico — PLAN-15

## Enfoque

Un `docker-compose.yml` integral vive en el repo `backend` (decisión pendiente de confirmar, ver
Supuestos) y orquesta cuatro servicios de larga vida más un job de inicialización:

```
navegador ──► backoffice (NGINX unprivileged, :8081→8080)
                 ├─ sirve el bundle Angular
                 └─ proxy: /api/ , /salud , /health ──► backend (Spring Boot, :8080)
                                                          ├─► postgres (16-alpine, volumen)
                                                          └─► volumen de storage local
              minio (:9000 API / :9001 consola, volumen)  ◄── minio-init (crea el bucket y termina)
```

La decisión que ordena el resto: **el backoffice llama a la API en el mismo origen**. Hoy el bundle de
producción tiene `apiUrl` fijo en `http://localhost:8080` y el backend no tiene CORS; en vez de agregar
CORS al backend (fuera de alcance) o hornear una URL absoluta en la imagen, se agrega una configuración
de build `docker` con `apiUrl: ''` y NGINX proxya `/api/`, `/salud` y `/health` al backend. Las rutas
resultantes (`/api/v1/auth/login`, `/salud`) son relativas y funcionan igual en cualquier host.

Los tres `Dockerfile` son multi-stage y de usuario no root. El script de healthcheck levanta el
compose, espera a `healthy`, prueba con `curl` y baja todo. El APK va en un `Dockerfile` aparte que
**no** forma parte del compose de servicios.

## Archivos a tocar

### backend/

| Archivo | Acción | Para qué |
|---|---|---|
| `Dockerfile` | crear | Multi-stage: build con `eclipse-temurin:21-jdk-alpine` (deps Maven en capa aparte) y ejecución con `eclipse-temurin:21-jre-alpine`, usuario no root |
| `.dockerignore` | crear | Excluir `target/`, `.git`, `.env*`, IDE: contexto chico y sin secretos |
| `docker-compose.yml` | modificar | Pasar de "sólo Postgres" a la orquestación integral: postgres, minio, minio-init, backend, backoffice; red `planillero-net`, volúmenes, healthchecks, `depends_on: service_healthy` |
| `.env.example` | crear | Todas las variables del compose, con valores de ejemplo **ficticios** |
| `.gitignore` | modificar | Asegurar `.env` ignorado |
| `.gitattributes` | modificar | `*.sh text eol=lf` (un `.sh` con CRLF no arranca en Linux; hoy sólo `mvnw` está cubierto) |
| `scripts/verify-compose.sh` | crear | Healthcheck automatizado: levanta, espera `healthy`, `curl`, baja; exit ≠ 0 si falla |
| `README.md` | modificar | Cómo levantar, variables, cómo correr el script |

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `Dockerfile` | crear | Stage Node 24 (`npm ci` + `ng build --configuration docker`) → `nginxinc/nginx-unprivileged:alpine` |
| `.dockerignore` | crear | Excluir `node_modules`, `dist`, `.angular`, `.git` |
| `docker/nginx.conf` | crear | gzip, headers de seguridad, fallback SPA, proxy a backend, `error_page` 404/502/503 |
| `docker/errors/404.html`, `502.html`, `503.html` | crear (3) | Páginas de error legibles, en español, autocontenidas (sin recursos externos: la CSP lo prohíbe) |
| `src/app/environments/environment.docker.ts` | crear | `apiUrl: ''` (mismo origen) |
| `angular.json` | modificar | Nueva configuración `docker` con `fileReplacements` hacia `environment.docker.ts` |
| `README.md` | modificar | Sección Docker |

### frontend/

| Archivo | Acción | Para qué |
|---|---|---|
| `docker/Dockerfile.apk` | crear | JDK 17 + Android SDK + Node; `expo prebuild` + `gradlew assembleRelease`; recibe `EXPO_PUBLIC_API_URL` como `ARG` |
| `scripts/build-apk.sh` | crear | Envuelve `docker build` + copia el APK a `./dist-apk/` |
| `.dockerignore` | crear | Excluir `node_modules`, `.expo`, `.env`, `android/` |
| `README.md` | modificar | Sección "Generar el APK con Docker" |

**Total: 22 archivos** (límite sin checkpoint: 12) → el checkpoint es obligatorio.

## Decisiones técnicas

- **Proxy de NGINX en el mismo origen, con configuración de build `docker`.** Se descartó cambiar
  `environment.prod.ts` porque rompería el build de producción "normal" (hoy apunta a un backend local
  a propósito, con un comentario que lo dice); y se descartó agregar CORS al backend porque es código
  de producto fuera de alcance y abre superficie de ataque (OWASP A05) que el proxy evita por completo.
- **`nginxinc/nginx-unprivileged` en lugar de `nginx:alpine` + `USER nginx`.** Se descartó la imagen
  estándar porque no corre sin root de fábrica (escribe en `/var/run` y escucha en el puerto 80) y
  forzarlo requiere reescribir pid, temp paths y puerto. La variante `unprivileged` escucha en 8080 y
  ya es no root.
- **JRE Alpine para ejecutar, JDK sólo para construir.** Se descartó una imagen única con JDK porque
  agrega cientos de MB y herramientas de compilación al runtime (OWASP A06).
- **`sh mvnw` en el Dockerfile en vez de depender del bit de ejecución.** `mvnw` está versionado como
  `100644`; invocarlo con `sh` evita que el build falle según cómo se haya hecho el checkout.
- **Healthcheck del backend con `wget` (busybox) contra `/health`.** Se descartó agregar Actuator
  porque es una dependencia nueva de producto sólo para esto, y `/health` ya es público. Se descartó
  `curl` porque no viene en la imagen JRE Alpine.
- **MinIO provisto pero sin cablear al backend (`STORAGE_TYPE=local`).** Se descartó implementar el
  cliente S3 en esta tarea: es una funcionalidad de backend (fuera de alcance). Se agrega un volumen
  para el storage local del backend, para que las evidencias sobrevivan a un `down`.
- **Job `minio-init` con `minio/mc` para crear el bucket** `evidence` (el nombre que ya usa
  `MINIO_BUCKET`). Se descartó crearlo a mano o desde el backend: el compose debe quedar listo sin
  pasos manuales (criterio 1).
- **Script de healthcheck en POSIX `sh`.** Se descartó Node porque el repo `backend` es Maven y no
  debería requerir Node sólo para esto; se descartó PowerShell porque CI corre en Linux. En Windows
  se ejecuta con Git Bash (ya instalado con git).
- **Secretos sin valor por defecto en el compose** (`${HMAC_SECRET:?falta HMAC_SECRET}`): si falta la
  variable, el compose falla con un mensaje claro en lugar de arrancar con una clave conocida.

## Contrato de API

No aplica: la tarea no crea ni modifica endpoints. El alcance incluye los tres repos por sus
artefactos de infraestructura, no por contrato. **No se emite `03-contrato-api.md`** y los repos de
cliente no dependen del backend en esta tarea.

## Supuestos

- `RIESGO` **El compose integral vive en `backend/` y usa contextos `../backoffice` y `../frontend`.**
  Sólo funciona con los repos clonados como carpetas hermanas (como en este workspace). Si el equipo
  prefiere otro lugar (repo de infraestructura propio, o el harness), cambia la ubicación de casi todo.
- `RIESGO` **La imagen de MinIO se puede descargar.** MinIO dejó de publicar imágenes de la edición
  community en Docker Hub durante 2025 y no puedo confirmar el estado actual sin red. Si `minio/minio`
  ya no existe, hay que fijar otra fuente (`quay.io/minio/minio` con un tag conocido, o una alternativa
  S3-compatible). Se verifica con `docker pull` en la fase 4.
- `RIESGO` **El daemon de Docker tiene que estar corriendo para verificar.** El CLI está instalado
  pero el daemon estaba apagado. Sin daemon, los criterios 1–12 sólo se pueden validar leyendo los
  archivos, no ejecutándolos. Le pido a quien apruebe el plan que inicie Docker Desktop.
- `RIESGO` **Generar el APK dentro de Docker puede no llegar a completarse** (Android SDK de varios
  GB, `expo prebuild` sobre Expo 57, tiempos de Gradle). Se entrega el Dockerfile y el script; si el
  build real no se logra, el PR lo declara «no verificado» (pregunta abierta 3 de la spec).
- La descripción del issue en Jira coincide con `docs/BACKLOG_PLANILLERO.md` (no se pudo leer:
  bloqueo por IP del MCP de Atlassian).
- `tag`s de imagen de `eclipse-temurin:21-jre-alpine`, `nginxinc/nginx-unprivileged:alpine`,
  `postgres:16-alpine` y `node:24-alpine` existen. `node:24` es lo que pide `engines` del backoffice.
- La CSP `default-src 'self'; img-src 'self' data: https://tile.openstreetmap.org; style-src 'self'
  'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'` alcanza para que
  el backoffice funcione (los tiles de Leaflet vienen de OpenStreetMap). El build de Angular puede
  emitir un `onload` inline para cargar el CSS crítico, que esa CSP bloquearía: se inspecciona el
  `index.html` generado y, si está, se desactiva `inlineCritical` en la configuración `docker`.
- El error 503 no tiene una forma natural de provocarse; se valida con `nginx -t` y leyendo la
  configuración, no con `curl` (los criterios de 404 y 502 sí se prueban de punta a punta).
- Los datos y credenciales de ejemplo del `.env.example` son ficticios y sólo para uso local.

## Cómo se prueba

1. `docker compose config` valida el YAML y que las variables obligatorias estén definidas.
2. `docker compose up --build -d` + `docker compose ps`: los cuatro servicios en `healthy`.
3. `bash scripts/verify-compose.sh` de punta a punta (criterio 12); debe fallar con código ≠ 0 si se
   detiene un servicio (probar el camino de error, no sólo el feliz).
4. `curl -I http://localhost:8081/` → headers de seguridad (criterio 8); `curl -i .../no-existe` →
   404 propia; `docker compose stop backend` y `curl -i .../salud` → 502 propia (criterio 9).
5. `docker compose exec backend id -u` y `docker compose exec backoffice id -u` ≠ 0 (criterio 7).
6. `docker compose down && docker compose up -d`: los datos de Postgres siguen (criterio 4).
7. Gates de los tres repos con `node .agents/scripts/verificar.mjs --tarea PLAN-15` (criterio 15);
   en particular, el build del backoffice con la nueva configuración `docker`.
8. APK: `frontend/scripts/build-apk.sh` si el entorno lo permite (criterio 13), o «no verificado».
