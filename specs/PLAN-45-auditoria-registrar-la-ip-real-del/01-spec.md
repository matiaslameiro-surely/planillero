# PLAN-45 — Auditoría: registrar la IP real del cliente y no la del proxy NGINX

## Contexto y problema

En la arquitectura con contenedor de proxy inverso (NGINX en el compose de producción y desarrollo local), NGINX recibe las peticiones externas (puerto 8081) y las redirige al backend de Spring Boot (puerto 8080).

Actualmente, `AuditRequestContext` obtiene la dirección IP de la petición mediante `request.getRemoteAddr()`. Al no estar configurada la estrategia de cabeceras de reenvío (`server.forward-headers-strategy`) en Spring Boot, el servidor embebido Tomcat no procesa las cabeceras `X-Forwarded-For` ni `X-Real-IP` enviadas por NGINX. Como resultado, todas las acciones auditadas en la base de datos registran la IP interna del contenedor de NGINX (ej. `172.19.0.5` en Docker) en lugar de la IP real del cliente/navegador.

Asimismo, NGINX concatenaba la cabecera `X-Forwarded-For` mediante `$proxy_add_x_forwarded_for`. Como Tomcat omite las IPs privadas de `internalProxies` al evaluar la cabecera de derecha a izquierda, si un cliente enviaba una cabecera `X-Forwarded-For` falsa desde una IP privada (como el compose local), Tomcat tomaba la IP falsa. Para evitar esto, NGINX como proxy de borde debe pisar `X-Forwarded-For` con `$remote_addr`.

Dado que la bitácora de auditoría constituye la cadena de custodia legal y pericial del sistema (PLAN-11), es indispensable que registre la IP real del cliente para mantener la trazabilidad y el valor probatorio de cada acción.

## Alcance

**Repos que toca:** `backend`, `backoffice`

## Criterios de aceptación

1. Al acceder a través de un proxy inverso de confianza (como NGINX en Docker), los eventos de auditoría registran en la columna `ip` la dirección IP real del cliente (enviada en `X-Forwarded-For`).
2. Se activa el soporte nativo de headers de reenvío en Spring Boot (`server.forward-headers-strategy=native`), delegando el manejo a `RemoteIpValve` de Tomcat.
3. Se confía únicamente en proxies internos (por defecto el rango de redes privadas RFC 1918 / Docker / loopback cubierto por Tomcat). Peticiones que intenten enviar cabeceras `X-Forwarded-For` falsificadas a través del proxy no deben alterar la IP registrada porque NGINX pisa la cabecera con `$remote_addr`.
4. Llamadas directas al backend (sin proxy, puerto 8080) continúan registrando la IP de la conexión TCP real.
5. Se agregan pruebas automatizadas de integración que verifiquen el registro de la IP correcta tanto a través de proxy de confianza como en conexiones directas y escenarios de cabecera falsificada.
6. Todos los gates de verificación de `backend` y `backoffice` pasan en verde.

## Fuera de alcance

- Cambios en el frontend móvil o en la interfaz gráfica del backoffice web.
- Modificación del esquema de base de datos o estructura de la tabla `audit.audit_logs`.

## Preguntas abiertas

Ninguna.
