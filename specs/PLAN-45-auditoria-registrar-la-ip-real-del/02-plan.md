# Plan técnico — PLAN-45

## Enfoque

Habilitar la estrategia nativa de cabeceras de reenvío de Spring Boot mediante la propiedad `server.forward-headers-strategy=native` en `application.properties`. 

Esto activa de forma estándar el `RemoteIpValve` de Tomcat embebido. `RemoteIpValve` evalúa si la conexión proviene de un proxy interno de confianza (por defecto cubre el rango de redes privadas RFC 1918 `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16` y loopback `127.0.0.0/8`, `::1`). Al recibir una petición desde NGINX (que corre en la red interna de Docker `172.19.x.x`), Tomcat extrae la IP real del cliente desde la cabecera `X-Forwarded-For` y la coloca en `request.getRemoteAddr()`.

De esta forma, `AuditRequestContext.java` (y cualquier otro componente que consuma `request.getRemoteAddr()`) obtendrá la IP real del cliente sin necesidad de lógica ad-hoc de parsing de headers, manteniendo la protección contra spoofing en conexiones directas.

Adicionalmente, se implementa una suite de tests de integración con servidor embebido (`webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT`) para verificar que:
1. Una petición autenticada simulando venir a través de un proxy interno (`X-Forwarded-For` desde `127.0.0.1`) registre la IP del cliente en `audit.audit_logs`.
2. Una petición directa sin headers de reenvío registre la IP de la conexión local (`127.0.0.1`).

## Archivos a tocar

### backend/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/main/resources/application.properties` | modificar | Configurar `server.forward-headers-strategy=native` |
| `src/test/java/ar/com/planillero/audit/AuditRemoteIpIntegrationTest.java` | crear | Test de integración con servidor web real para verificar resolución de IP vía Tomcat `RemoteIpValve` |

## Decisiones técnicas

- **Uso de `server.forward-headers-strategy=native` en lugar de `framework` o parsing manual en `AuditRequestContext`** — Se descartó la extracción manual de `X-Forwarded-For` en `AuditRequestContext` y la estrategia `framework` (Spring `ForwardedHeaderFilter`) porque `native` aprovecha la integración de bajo nivel de Tomcat (`RemoteIpValve`), la cual está optimizada, valida los proxies internos por defecto y previene vulnerabilidades de header injection/spoofing sin escribir código personalizado.
- **Mantener el valor por defecto de `server.tomcat.remoteip.internal-proxies`** — El patrón por defecto de Tomcat cubre todas las redes privadas (RFC 1918), lo cual incluye las subredes de Docker (`172.16.0.0/12`) y `localhost` (`127.0.0.1`), adaptándose tanto al entorno local de compose como a posibles despliegues con proxies en red local.

## Supuestos

- Ninguno.

## Cómo se prueba

1. Ejecución del test de integración específico `AuditRemoteIpIntegrationTest` que lanza peticiones HTTP reales contra el puerto aleatorio de Spring Boot:
   - Envío de request con header `X-Forwarded-For: 203.0.113.195` -> verificar que el registro en `audit.audit_logs` guarde `203.0.113.195`.
   - Envío de request directo sin headers de reenvío -> verificar que el registro en `audit.audit_logs` guarde `127.0.0.1`.
2. Ejecución de suite completa de verificación mediante `node .agents/scripts/verificar.mjs --tarea PLAN-45`.
