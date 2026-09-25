# Tareas — PLAN-45

## backend

- [x] `[backend]` Configurar `server.forward-headers-strategy=native` en `application.properties`
- [x] `[backend]` Documentar comportamiento de RemoteIpValve y Docker local en `application.properties`
- [x] `[backend]` Crear `AuditRemoteIpIntegrationTest` para validar resolución de IP con `X-Forwarded-For`, conexión directa y Criterio 3 (spoofing)

## backoffice *(web)*

- [x] `[backoffice]` Configurar `proxy_set_header X-Forwarded-For $remote_addr` en `docker/nginx.conf` para evitar spoofing

## Verificación

- [x] Gates en verde en los repos del alcance (`node .agents/scripts/verificar.mjs`)
- [x] Revisión independiente sin hallazgos `critical` ni `high`
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto
