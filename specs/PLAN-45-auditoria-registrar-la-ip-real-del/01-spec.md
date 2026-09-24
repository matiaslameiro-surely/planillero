# PLAN-45 — Auditoría: registrar la IP real del cliente y no la del proxy NGINX

## Contexto y problema

En la arquitectura con contenedor de proxy inverso (NGINX en el compose de producción y desarrollo local), NGINX recibe las peticiones externas (puerto 8081) y las redirige al backend de Spring Boot (puerto 8080).

Actualmente, `AuditRequestContext` obtiene la dirección IP de la petición mediante `request.getRemoteAddr()`. Al no estar configurada la estrategia de cabeceras de reenvío (`server.forward-headers-strategy`) en Spring Boot, el servidor embebido Tomcat no procesa las cabeceras `X-Forwarded-For` ni `X-Real-IP` enviadas por NGINX. Como resultado, todas las acciones auditadas en la base de datos registran la IP interna del contenedor de NGINX (ej. `172.19.0.5` en Docker) en lugar de la IP real del cliente/navegador.

Dado que la bitácora de auditoría constituye la cadena de custodia legal y pericial del sistema (PLAN-11), es indispensable que registre la IP real del cliente para mantener la trazabilidad y el valor probatorio de cada acción.

## Alcance

**Repos que toca:** `backend`

## Criterios de aceptación

1. Al acceder a través de un proxy inverso de confianza (como NGINX en Docker), los eventos de auditoría registran en la columna `ip` la dirección IP real del cliente (enviada en `X-Forwarded-For`).
2. Se activa el soporte nativo de headers de reenvío en Spring Boot (`server.forward-headers-strategy=native`), delegando el manejo a `RemoteIpValve` de Tomcat.
3. Se confía únicamente en proxies internos (por defecto el rango de redes privadas RFC 1918 / Docker / loopback cubierto por Tomcat). Peticiones directas desde hosts no confiables que envíen cabeceras `X-Forwarded-For` falsificadas no deben alterar la IP registrada (se mantiene la IP de la conexión directa).
4. Llamadas directas al backend (sin proxy, puerto 8080) continúan registrando la IP de la conexión TCP real.
5. Se agregan pruebas automatizadas de integración que verifiquen el registro de la IP correcta tanto a través de proxy de confianza como en conexiones directas.
6. Todos los gates de verificación del backend pasan en verde.

## Fuera de alcance

- Modificaciones en la configuración de NGINX en `backoffice` (ya envía correctamente `X-Real-IP` y `X-Forwarded-For`).
- Cambios en el frontend móvil o backoffice web.
- Modificación del esquema de base de datos o estructura de la tabla `audit.audit_logs`.

## Preguntas abiertas

Ninguna.
