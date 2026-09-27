# PLAN-36 — Entrega final: publicar la aplicación en un entorno accesible por URL

## Contexto y problema

La consigna de la entrega final de la Universidad Tecnológica Nacional (`docs/Entrega final curso.pdf` y `docs/entrega_final_texto.txt`) exige, en la primera página del informe, el enlace a la «Aplicación web en producción», advirtiendo: *«Sin links válidos y funcionales al momento de la corrección, la entrega no se aprueba. El docente abrirá los links […] y evaluará que el sitio web o la app esté funcionando al momento de la corrección»*.

Hasta ahora el ecosistema sólo se ejecuta localmente mediante la dockerización de desarrollo de PLAN-15 (`backend/docker-compose.yml`). El usuario dispone de un VPS en Hostinger con Docker Manager para alojar el entorno de producción. Se requiere preparar la configuración, orquestación, aprovisionamiento de secretos y guía operativa para desplegar el sistema en este entorno con alta disponibilidad, persistencia y HTTPS.

## Alcance

**Repos que toca:** `backend`, `backoffice`

- `backend`:
  - Definición de compose para producción (`docker-compose.prod.yml`) optimizada para despliegue en VPS (sin MinIO, almacenamiento pericial persistente en volumen, exposición en puertos web).
  - Plantilla de variables de entorno para producción (`.env.production.example`).
  - Soporte de claves JWT RSA persistentes en variables de entorno o volumen para evitar la caducidad de sesiones al reiniciar contenedores.
  - Script utilitario para generación de claves JWT RSA y HMAC secret seguro.
  - Verificación del seed de datos de demostración en Flyway para usuarios y visitas de prueba.
- `backoffice`:
  - Ajuste en `nginx.conf` para propagar cabeceras de proxy (`X-Forwarded-Proto`, `X-Forwarded-For`) cuando se encuentra detrás de un reverse proxy con SSL en el VPS.
  - Documentación detallada de despliegue en Hostinger VPS con Docker Manager.

## Criterios de aceptación

1. **Orquestación de producción:** Existe una configuración Docker Compose lista para producción (`docker-compose.prod.yml`) que levanta `postgres` (16-alpine con volumen persistente), `backend` (Spring Boot 4.1.1 en Eclipse Temurin 21) y `backoffice` (Angular 22 servido por NGINX unprivileged) en una red interna aislada.
2. **Sin dependencias superfluas:** MinIO, RabbitMQ y Ollama quedan excluidos del despliegue de producción. El backend utiliza `STORAGE_TYPE=local` sobre un volumen persistente montado en `/app/storage`.
3. **Persistencia de sesiones JWT:** La configuración de producción permite inyectar o montar claves RSA de 2048 bits para firma y verificación de tokens JWT (`app.jwt.private-key` y `app.jwt.public-key`), impidiendo la invalidación de sesiones tras reinicios. Se incluye script para generarlas.
4. **Seguridad y secretos:** Existe `.env.production.example` documentando todas las variables requeridas (`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `HMAC_SECRET`, `JWT_*`, `WEB_PORT`, etc.). Ningún secreto real se versiona en git.
5. **Compatibilidad con Proxy / HTTPS:** La configuración de NGINX en `backoffice` preserva `X-Forwarded-Proto` y `X-Forwarded-For` para que Tomcat `RemoteIpValve` reconozca peticiones HTTPS terminadas en el proxy/gestor del VPS.
6. **Datos de demo verificables:** Al iniciar el entorno con una base nueva, las migraciones Flyway (`V3__auth_seed.sql`, `V7__route_scheduling.sql`, etc.) cargan automáticamente los usuarios (`admin.demo`, `supervisor.demo`, `operador.demo` con contraseña documentada) y visitas de prueba para la evaluación del docente.
7. **Salud y validación:** El endpoint público `/health` responde con estado HTTP 200 a través del backoffice. Se provee un script o comando de verificación remota para validar el despliegue una vez arriba.
8. **Guía de despliegue en Hostinger:** Se incluye una guía paso a paso (`DEPLOY_HOSTINGER.md`) que explica cómo importar el compose en Hostinger Docker Manager, configurar variables de entorno, mapear dominio/subdominio, activar SSL/HTTPS y verificar el servicio.

## Fuera de alcance

- Publicación de la app móvil en Google Play Store / Apple App Store (la consigna contempla el APK generado con `frontend/scripts/build-apk.sh <URL-pública>` apuntando al backend publicado).
- Proveedores de nube alternativos (Render, Railway, Fly.io, AWS) más allá de la guía para VPS Docker.
- Implementación de broker de mensajería (RabbitMQ) o modelos LLM locales (Ollama), considerados Post-MVP en el backlog.

- [x] **Dominio y terminación SSL:** Definido. Se utilizará el subdominio `planillero.ferchamorro.cloud` y **Traefik** como proxy inverso con terminación HTTPS / Let's Encrypt en el VPS.
- [x] **Red y configuración de Traefik:** Confirmada con el entorno real:
  - Red Docker externa: `pigar-staging_edge`
  - Etiqueta de red: `traefik.docker.network=pigar-staging_edge`
  - Entrypoint HTTPS: `websecure`
  - Certresolver TLS: `letsencrypt`
  - Router TLS: `traefik.http.routers.planillero-secure.tls=true`
  - Puerto de servicio: `8080`
