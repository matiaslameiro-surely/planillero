# PLAN-15 — TASK-02: Dockerización Integral del Ecosistema y Orquestación de Entornos

## Contexto y problema

Hoy el proyecto sólo se levanta "a mano": el backend corre con `mvnw`, el backoffice con `ng serve`
y lo único dockerizado es un PostgreSQL de desarrollo (`backend/docker-compose.yml`). No hay forma de
levantar el ecosistema completo con un comando ni de reproducir el entorno en otra máquina o en CI.

Se necesita un entorno reproducible y aislado para el MVP: backend Spring Boot, backoffice Angular
servido por NGINX, PostgreSQL y MinIO, orquestados con Docker Compose, más un camino para empaquetar
el APK de la app móvil dentro de un contenedor.

> **Nota sobre la fuente.** La spec se escribió a partir de `docs/BACKLOG_PLANILLERO.md` (TAREA 02)
> porque el MCP de Jira bloqueó la lectura por IP en esa fase. Después se leyó el issue y coincide,
> salvo que su descripción **no menciona el APK** de la app móvil (el backlog sí). El plan se aprobó
> con el APK incluido.

### Estado actual relevante (verificado en el código)

- **Backend** (Spring Boot 4.1.1, Java 21, Maven con wrapper): sin `Dockerfile`. Toda la configuración
  sensible ya sale de variables de entorno (`SPRING_DATASOURCE_*`, `JWT_*`, `MINIO_*`, `HMAC_SECRET`,
  `STORAGE_TYPE`). El endpoint de salud es `/health` (y `/salud`), público; **no hay Actuator**.
- **Almacenamiento:** existe sólo `LocalStorageService`; hay propiedades `MINIO_*` pero **no hay
  implementación que hable con MinIO**. MinIO en el compose queda provisto y listo, pero el backend
  seguirá usando `STORAGE_TYPE=local` (con un volumen para que persista).
- **CORS:** el backend no tiene configuración de CORS. Un navegador en `:4200`/`:8080` distintos
  no podría llamarlo; en Docker esto se evita sirviendo el backoffice y proxyando la API desde el
  mismo origen.
- **Backoffice** (Angular 22, Node 24.15): `environment.prod.ts` tiene `apiUrl` fijo en
  `http://localhost:8080`, resuelto en tiempo de build con `fileReplacements`.
- **Frontend móvil** (Expo 57): configura el backend con `EXPO_PUBLIC_API_URL`, que queda dentro del
  bundle. No tiene carpeta `android/`: el APK requiere `expo prebuild` + Gradle.
- **Docker:** el daemon estaba apagado al preparar la tarea; se inició antes de verificar.

## Alcance

**Repos que toca:** `backend`, `backoffice`, `frontend`

- `backend`: `Dockerfile` del servicio, `.dockerignore`, y el `docker-compose.yml` integral con
  `.env.example`.
- `backoffice`: `Dockerfile` (build + NGINX), configuración NGINX, páginas de error, `.dockerignore`
  y el ajuste mínimo para que el bundle llame a la API en el mismo origen.
- `frontend`: `Dockerfile` y script de empaquetado del APK Android.

## Criterios de aceptación

1. `docker compose up --build` levanta, sin pasos manuales adicionales, los servicios `postgres`,
   `minio`, `backend` y `backoffice`, todos en la red interna `planillero-net`.
2. El compose **no** incluye RabbitMQ ni Ollama (decisión de MVP del backlog).
3. Los cuatro servicios definen `healthcheck` y todos alcanzan el estado `healthy`. El `backend`
   arranca sólo cuando `postgres` está `healthy` y aplica las migraciones Flyway al iniciar.
4. PostgreSQL usa un volumen persistente: tras `docker compose down` y `up`, los datos siguen.
   MinIO también persiste en un volumen.
5. `Dockerfile` del backend: multi-stage sobre Eclipse Temurin 21 (build con JDK, ejecución con JRE),
   con la resolución de dependencias Maven en una capa aparte del código para aprovechar la caché.
6. `Dockerfile` del backoffice: multi-stage (build Node → NGINX Alpine) con compresión gzip.
7. Los contenedores de backend y backoffice corren como usuario **no root** (verificable con
   `docker compose exec <servicio> id -u` ≠ 0). Imágenes base mínimas (Alpine / JRE).
8. NGINX responde con los headers `Content-Security-Policy`, `Strict-Transport-Security`,
   `X-Frame-Options: DENY` y `X-Content-Type-Options: nosniff`.
9. NGINX sirve páginas de error propias y legibles para 404, 502 y 503 (verificable con `curl`
   sobre una ruta inexistente y con el backend detenido).
10. Desde `http://localhost:<puerto-web>` el backoffice carga y el indicador de salud llega al backend
    a través del proxy de NGINX (sin errores de CORS).
11. No hay secretos versionados: existe `.env.example` con todas las variables del compose y el
    `.env` real está en `.gitignore` de cada repo donde se use. Las imágenes no contienen `.env`.
12. Existe un script de healthcheck (`scripts/`) que levanta el compose completo, espera a que todos
    los servicios estén `healthy`, ejecuta pruebas `curl` (salud del backend y del backoffice, y la
    página de error 404) y sale con código ≠ 0 si algo falla. Baja el entorno al terminar.
13. Existe un `Dockerfile` y un script en `frontend` que, con un comando documentado, generan un APK
    Android a partir del código (`expo prebuild` + Gradle), recibiendo `EXPO_PUBLIC_API_URL` como
    argumento de build.
14. Los README de `backend`, `backoffice` y `frontend` explican cómo levantar el entorno, las
    variables y cómo correr el script de healthcheck.
15. Los gates existentes de cada repo siguen en verde (backend: compilar y tests; backoffice: lint,
    build y tests; frontend: lint, tipos).

## Fuera de alcance

- RabbitMQ, Ollama y cualquier servicio de las tareas Post-MVP (PLAN-19, PLAN-20, PLAN-21).
- Implementar el cliente MinIO/S3 en el backend: el backend sigue con almacenamiento local. Sólo se
  provee el servicio y el bucket.
- Agregar CORS al backend (se resuelve con el proxy en el mismo origen).
- Pipeline de CI/CD (el script es lo que un pipeline invocaría, pero no se crea el pipeline).
- TLS real / certificados: `Strict-Transport-Security` se emite, pero el compose sirve HTTP en local.
- Publicar imágenes en un registro, orquestación en producción (Kubernetes, etc.).
- Firmar el APK con un keystore de release: el APK que se genera es para pruebas.

## Preguntas abiertas

Todas eran `NO-BLOQUEANTE` y quedaron resueltas.

- [x] **1. Descripción del issue en Jira sin cotejar.** Resuelta: se leyó el issue y coincide con la
  spec, salvo que **no menciona el APK** (sí el backlog). Se mantuvo el APK por lo aprobado en el plan.
- [x] **2. ¿Dónde vive el compose integral?** Resuelta y aprobada en el checkpoint del plan:
  `backend/docker-compose.yml`, con el contexto del backoffice en `../backoffice` (asume los repos
  como carpetas hermanas).
- [x] **3. APK en contenedor: alcance de la validación.** Resuelta: el build real se hizo y produjo un
  APK de 124 MB (43 min, sólo amd64). No forma parte del `docker compose up`.
- [x] **4. Puertos.** Resuelta: web `8081` → NGINX sin privilegios en `:8080`, backend `8080`,
  Postgres `5432`, MinIO `9000`/`9001`; todos configurables por `.env` y publicados sólo en
  `127.0.0.1`.
