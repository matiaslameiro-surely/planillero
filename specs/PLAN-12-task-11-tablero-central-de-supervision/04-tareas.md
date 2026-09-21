# Tareas — PLAN-12

## backend

- [x] `[backend]` Crear migración Flyway `V11__supervision_and_shifts.sql` (tabla `visits.operator_shifts`, vista alias `visits.operador_turnos`, índices analíticos y seed)
- [x] `[backend]` Crear entidad `OperatorShift`, enum `ShiftStatus` y `OperatorShiftRepository`
- [x] `[backend]` Crear DTOs analíticos (`DashboardSummaryDto`, `OperatorStatusDto`, `HeartbeatRequest`, `HeartbeatResponse`, `SupervisionExceptionDto`)
- [x] `[backend]` Implementar `SupervisionService` (cálculo de KPIs, métricas SLA, detección offline, filtro horizontal de jurisdicción OWASP A01 y sanitización XSS)
- [x] `[backend]` Implementar `SupervisionController` (`GET /api/v1/supervision/tablero-resumen`, `GET /api/v1/supervision/operadores/estado`, `POST /api/v1/supervision/heartbeat`)
- [x] `[backend]` Crear tests unitarios e integración (`SupervisionServiceTest`, `SupervisionControllerTest`) con validación de seguridad y carga
- [x] `[backend]` Emitir `03-contrato-api.md` *(obligatorio: consumido por frontend y backoffice)*

## frontend *(app móvil)*

- [x] `[frontend]` Leer `03-contrato-api.md` antes de empezar
- [x] `[frontend]` Implementar hook/servicio `useHeartbeat` consumiendo `useDeviceStatus` y enviando `POST /api/v1/supervision/heartbeat`
- [x] `[frontend]` Integrar `useHeartbeat` en la navegación/pantalla del operador
- [x] `[frontend]` Escribir tests unitarios `useHeartbeat.test.ts` validando telemetría y resiliencia offline

## backoffice *(web)*

- [x] `[backoffice]` Leer `03-contrato-api.md` antes de empezar
- [x] `[backoffice]` Definir modelos TypeScript en `supervision.model.ts`
- [x] `[backoffice]` Implementar `SupervisionService` (llamadas HTTP con tipado estricto)
- [x] `[backoffice]` Implementar componente `SupervisionMap` (Leaflet/OSM, marcadores de operadores y visitas)
- [x] `[backoffice]` Implementar página principal de supervisión (`supervision.ts`, `supervision.html`, `supervision.scss`) con KPIs, alertas destacadas, grilla reactiva y polling (30s/60s/manual)
- [x] `[backoffice]` Configurar rutas en `app.routes.ts` y enlace en menú de inicio
- [x] `[backoffice]` Escribir tests unitarios en `supervision.spec.ts` y verificar build/lint

## Verificación

- [x] Gates en verde en los tres repositorios (`node .agents/scripts/verificar.mjs --tarea PLAN-12`)
- [x] Revisión independiente sin hallazgos `critical` ni `high` (`node .agents/scripts/revisar.mjs`)
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto y verificado
