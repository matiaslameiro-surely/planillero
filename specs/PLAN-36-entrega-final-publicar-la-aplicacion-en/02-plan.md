# Plan técnico — PLAN-36

## Enfoque

El objetivo es preparar y documentar la infraestructura de despliegue para publicar el ecosistema de Planillero en un VPS de Hostinger con Docker Manager, cumpliendo con la exigencia de la entrega final universitaria (disponibilidad por URL pública, HTTPS, persistencia y datos de demo).

A diferencia del entorno de desarrollo local (PLAN-15) que expone puertos de depuración en loopback y genera claves JWT efímeras en memoria, el entorno de producción:
1. Orquesta los 3 componentes esenciales (`postgres:16-alpine`, `backend` Spring Boot y `backoffice` Angular/NGINX) bajo `docker-compose.prod.yml` en una red interna privada `planillero-prod-net`, aislando la base de datos y la API interna.
2. Integra el servicio `backoffice` con **Traefik** mediante las etiquetas exactas del VPS:
   - `traefik.enable=true`
   - `traefik.docker.network=pigar-staging_edge`
   - `traefik.http.routers.planillero-secure.rule=Host('planillero.ferchamorro.cloud')`
   - `traefik.http.routers.planillero-secure.entrypoints=websecure`
   - `traefik.http.routers.planillero-secure.tls=true`
   - `traefik.http.routers.planillero-secure.tls.certresolver=letsencrypt`
   - `traefik.http.services.planillero.loadbalancer.server.port=8080`
   y conexión a la red externa `pigar-staging_edge`.
3. Persiste la base de datos en un volumen nombrado `planillero-pgdata` y el almacenamiento pericial de archivos en `planillero-storage` (`STORAGE_TYPE=local`). MinIO se descarta para ahorrar recursos del VPS ya que el almacenamiento local pericial cubre el 100% de la funcionalidad.
4. Permite inyectar un par de claves RSA 2048 bits montadas en `/app/keys` para firma RS256 de JWT, garantizando que los tokens y sesiones sobrevivan a reinicios de contenedores o despliegues.
5. Ajusta la configuración de NGINX en `backoffice` con mapas para propagar `X-Forwarded-Proto` y `X-Forwarded-For` provenientes de Traefik hacia Tomcat de forma limpia.
6. Proporciona scripts de generación de claves/secretos y de validación remota del despliegue, junto con una guía exhaustiva paso a paso para Hostinger VPS (`DEPLOY_HOSTINGER.md`).

## Archivos a tocar

### backend/

| Archivo | Acción | Para qué |
|---|---|---|
| `docker-compose.prod.yml` | crear | Orquestación limpia de producción (postgres, backend, backoffice) sin MinIO ni puertos innecesarios. |
| `.env.production.example` | crear | Plantilla de variables de entorno para producción con todas las claves y explicaciones. |
| `scripts/generate-jwt-keys.sh` | crear | Generación desatendida de par de claves RSA 2048 (`private.pem`, `public.pem`) y HMAC secret. |
| `scripts/verify-deployment.sh` | crear | Script para comprobar remotamente la salud de la URL pública, headers de seguridad y login de demo. |
| `src/main/resources/application.properties` | modificar | Configurar `app.jwt.private-key` y `app.jwt.public-key` con ruta `/app/keys/*.pem` (con fallback transparente a efímeras si no existen). |
| `DEPLOY_HOSTINGER.md` | crear | Guía paso a paso para configurar el VPS de Hostinger, Docker Manager, certificados SSL y puesta en marcha. |

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `docker/nginx.conf` | modificar | Propagar correctamente `X-Forwarded-Proto` cuando NGINX recibe tráfico HTTPS desde el proxy/terminador TLS del VPS. |

## Decisiones técnicas

- **Traefik como proxy inverso y terminador TLS vía etiquetas Docker** — Se aprovecha la infraestructura existente del VPS donde Traefik gestiona los certificados HTTPS (Let's Encrypt). El servicio `backoffice` se une a la red de Traefik y declara las etiquetas correspondientes con la regla `Host(${APP_DOMAIN})` para su enrutamiento automático sin exponer puertos en la interfaz pública del host.
- **Descartar MinIO en producción y usar `STORAGE_TYPE=local` con volumen persistente** — Se descartó incluir MinIO en `docker-compose.prod.yml` porque el backend actual opera sobre almacenamiento local en disco (`LocalStorageService`) y MinIO consumiría CPU/RAM adicional en el VPS sin aportar valor en esta etapa. El volumen `planillero-storage` garantiza persistencia total de evidencias.
- **Claves JWT RSA montadas como volumen `/app/keys`** — Se descartó pasar las claves privadas en variables de entorno multilínea porque los formatos PEM con saltos de línea son propensos a truncamientos o problemas de encoding en interfaces web de VPS. Montar la carpeta `keys/` como volumen de sólo lectura (`:ro`) es el estándar más robusto en Docker.
- **NGINX con `map` para `X-Forwarded-Proto` y `X-Forwarded-For`** — Se descartó forzar valores estáticos o sobrescribir con `$remote_addr` porque Traefik es el proxy de borde que recibe al cliente real. Con `map`, si Traefik envía `X-Forwarded-For` y `X-Forwarded-Proto: https`, NGINX los preserva y los traslada al backend.
- **Automatización de verificación con `verify-deployment.sh`** — Se descartó depender de pruebas manuales en el navegador; un script que ejecuta `curl` sobre `/health`, `/` y `/api/v1/auth/login` permite validar el entorno inmediatamente tras el despliegue.

## Supuestos

- **Traefik ya corriendo en el VPS:** Se asume que Traefik está desplegado en la red `pigar-staging_edge` con un entrypoint para HTTPS (por defecto `websecure`) y un resolver de certificados ACME/Let's Encrypt (configurable por variable de entorno).
- **Red externa de Traefik:** `pigar-staging_edge`.
- **Subdominio apuntado al VPS:** Se creará el registro DNS tipo A `planillero.ferchamorro.cloud` apuntando a la IP pública del VPS de Hostinger.
- **Semilla de datos funcional en base vacía:** Se asume que las migraciones Flyway existentes inicializan la base con los roles y usuarios de demo (`admin.demo`, `supervisor.demo`, `operador.demo` con contraseña `Admin123!` / `Supervisor123!` / `Operador123!`).

## Cómo se prueba

1. **Prueba local de configuración y claves:**
   - Ejecutar `backend/scripts/generate-jwt-keys.sh` y validar que crea `private.pem` (PKCS#8) y `public.pem` (X.509).
   - Validar que el backend compila y pasa todos los tests unitarios y de integración (`mvnw test`).
2. **Prueba de arranque de compose de producción:**
   - Validar la sintaxis de `docker-compose.prod.yml` con `docker compose -f backend/docker-compose.prod.yml config`.
3. **Verificación de Backoffice:**
   - Ejecutar lint y build de backoffice (`npm run lint`, `npm run build`).
4. **Verificación remota:**
   - El script `backend/scripts/verify-deployment.sh` se ejecutará contra la URL del VPS una vez desplegado.
