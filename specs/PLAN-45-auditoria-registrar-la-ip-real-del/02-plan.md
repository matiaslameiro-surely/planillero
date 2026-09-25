# Plan técnico — PLAN-45

## Enfoque

1. **Backend:** Habilitar la estrategia nativa de cabeceras de reenvío de Spring Boot mediante la propiedad `server.forward-headers-strategy=native` en `application.properties`. Esto activa de forma estándar el `RemoteIpValve` de Tomcat embebido. `RemoteIpValve` evalúa si la conexión proviene de un proxy interno de confianza (por defecto redes privadas RFC 1918 `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16` y loopback `127.0.0.0/8`, `::1`). Al recibir una petición desde NGINX, Tomcat extrae la IP real del cliente desde la cabecera `X-Forwarded-For` y la coloca en `request.getRemoteAddr()`.
2. **Backoffice:** Configurar NGINX en `backoffice/docker/nginx.conf` con `proxy_set_header X-Forwarded-For $remote_addr;` para que pise cualquier cabecera `X-Forwarded-For` enviada por el cliente en vez de anexarla (`$proxy_add_x_forwarded_for`), previniendo que un cliente ubicado en una red interna o Docker envíe cabeceras falsificadas.
3. **Tests y Documentación:**
   - Documentar en `application.properties` el comportamiento en Docker local (donde NGINX ve la IP del gateway de Docker `172.x.0.1` al mapear a `127.0.0.1`).
   - Crear suite de tests `AuditRemoteIpIntegrationTest` con servidor web real que valide:
     - Resolución de IP real desde `X-Forwarded-For` vía proxy de confianza.
     - Conexión directa sin proxy registra IP de conexión (`127.0.0.1`).
     - Validación del escenario de cabeceras falsificadas pisadas por el proxy de borde (Criterio 3).

## Archivos a tocar

### backend/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/main/resources/application.properties` | modificar | Configurar `server.forward-headers-strategy=native` y documentar comportamiento de proxy y Docker local |
| `src/test/java/ar/com/planillero/audit/AuditRemoteIpIntegrationTest.java` | crear | Test de integración con servidor web real para verificar resolución de IP vía Tomcat `RemoteIpValve` y escenarios de spoofing |

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `docker/nginx.conf` | modificar | Configurar `proxy_set_header X-Forwarded-For $remote_addr` para pisar headers falsificados del cliente |

## Decisiones técnicas

- **Pisar `X-Forwarded-For` con `$remote_addr` en NGINX en vez de usar `$proxy_add_x_forwarded_for`** — Dado que NGINX es el proxy de borde único de entrada a la aplicación, debe establecer la IP real de conexión del cliente descartando cualquier cabecera previa que el cliente haya enviado para evitar ataques de spoofing.
- **Uso de `server.forward-headers-strategy=native` en lugar de `framework` o parsing manual en `AuditRequestContext`** — Se descartó la extracción manual de `X-Forwarded-For` en `AuditRequestContext` y la estrategia `framework` (Spring `ForwardedHeaderFilter`) porque `native` aprovecha la integración de bajo nivel de Tomcat (`RemoteIpValve`), la cual está optimizada y valida los proxies internos por defecto.

## Supuestos

- Ninguno.

## Cómo se prueba

1. Ejecución del test de integración específico `AuditRemoteIpIntegrationTest` que lanza peticiones HTTP reales contra el puerto aleatorio de Spring Boot:
   - Envío de request con header `X-Forwarded-For: 203.0.113.195` -> verificar que el registro en `audit.audit_logs` guarde `203.0.113.195`.
   - Envío de request directo sin headers de reenvío -> verificar que el registro en `audit.audit_logs` guarde `127.0.0.1`.
   - Envío de request simulando header pisado por NGINX ante intento de falsificación -> verificar que se registra la IP real.
2. Ejecución de suite completa de verificación mediante `node .agents/scripts/verificar.mjs --tarea PLAN-45`.
