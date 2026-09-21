# Plan técnico — PLAN-12

## Enfoque

Implementación del Tablero Central de Supervisión, Mapa Operativo y Monitoreo de Excepciones cubriendo las tres capas del producto (`backend`, `frontend` móvil y `backoffice` web):

1. **Backend (Spring Boot + PostgreSQL):**
   - Nueva migración Flyway `V11__supervision_and_shifts.sql` creando `visits.operator_shifts` (con vista alias `visits.operador_turnos`) e índices compuestos para consultas de alta velocidad sobre turnos y visitas por jurisdicción.
   - Módulo `ar.com.planillero.supervision`:
     - Entidad `OperatorShift` y repositorio JPA `OperatorShiftRepository`.
     - `SupervisionService` con lógica analítica agregada para KPIs de tablero, cálculo de operadores demorados (>45m en visita en curso), detección de operadores offline (>10m sin latido), control de acceso horizontal multi-tenant estricto por jurisdicción (OWASP A01) y sanitización de texto para mitigar XSS.
     - `SupervisionController` exponiendo los endpoints analíticos exactos requeridos: `GET /api/v1/supervision/tablero-resumen`, `GET /api/v1/supervision/operadores/estado` y `POST /api/v1/supervision/heartbeat`.
   - Pruebas de integración, verificación de autorización y simulación de carga para los endpoints analíticos.

2. **Frontend Móvil (React Native + Expo):**
   - Creación del hook/servicio `useHeartbeat` en `frontend/src/status/useHeartbeat.ts`.
   - Lee reactivamente el nivel de batería, estado de red (`useDeviceStatus`) y coordenadas GPS (`expo-location`).
   - Envía pings periódicos cada 60s al endpoint `POST /api/v1/supervision/heartbeat` durante turnos activos con el token del operador autenticado.
   - Manejo de fallos silencioso y transparente: ante pérdida de señal u offline, no molesta al usuario y reintenta en el próximo latido.

3. **Frontend Web / Backoffice (Angular):**
   - Módulo y pantalla `/supervision` en Angular con ChangeDetectionStrategy.OnPush y Signals:
     - Tarjetas superiores de KPIs métricos (total operadores, en campo, demorados, offline, turnos completos, % SLA).
     - Tarjetas destacadas de atención urgente para operadores fuera de SLA (Heurística UX 8: minimalismo y foco).
     - Grilla reactiva de operadores con badges de estado y consistencia de vocabulario idéntica al móvil (`En campo / En ruta`, `Demorado`, `Offline`, `Turno completo`).
     - Componente de mapa interactivo (`SupervisionMap`) basado en Leaflet/OSM mostrando operadores geolocalizados y visitas activas, con iconos distintivos y popups informativos.
     - Polling HTTP automático configurable (30s / 60s / Pausa) y botón "Actualizar ahora" con timestamp visible y limpieza de suscripciones en destrucción para evitar memory leaks.
     - Sanitización de observaciones para prevenir inyección XSS.
   - Integración de rutas protegidas en `app.routes.ts` y enlace en menú de navegación.

## Archivos a tocar

### backend/

| Archivo | Acción | Para qué |
|---|---|---|
| `backend/src/main/resources/db/migration/V11__supervision_and_shifts.sql` | crear | Migración Flyway: tabla `visits.operator_shifts`, vista `visits.operador_turnos`, índices compuestos y datos seed |
| `backend/src/main/java/ar/com/planillero/supervision/ShiftStatus.java` | crear | Enum de estados operativos (`EN_CAMPO`, `DEMORADO`, `OFFLINE`, `TURNO_COMPLETO`) |
| `backend/src/main/java/ar/com/planillero/supervision/OperatorShift.java` | crear | Entidad JPA para el turno operativo y telemetría de operadores |
| `backend/src/main/java/ar/com/planillero/supervision/OperatorShiftRepository.java` | crear | Repositorio JPA con queries optimizadas por fecha y jurisdicción |
| `backend/src/main/java/ar/com/planillero/supervision/dto/DashboardSummaryDto.java` | crear | DTO de respuesta para KPIs de `tablero-resumen` y excepciones |
| `backend/src/main/java/ar/com/planillero/supervision/dto/OperatorStatusDto.java` | crear | DTO de respuesta para estado detallado de cada operador |
| `backend/src/main/java/ar/com/planillero/supervision/dto/HeartbeatRequest.java` | crear | DTO de entrada para ping de latido periódico |
| `backend/src/main/java/ar/com/planillero/supervision/SupervisionService.java` | crear | Lógica de negocio analítica, filtrado por jurisdicción, detección de SLA/offline y registro de latidos |
| `backend/src/main/java/ar/com/planillero/supervision/SupervisionController.java` | crear | Endpoints REST de supervisión y heartbeat protegidos con RBAC |
| `backend/src/test/java/ar/com/planillero/supervision/SupervisionServiceTest.java` | crear | Pruebas unitarias de cálculo de KPIs, SLA, aislamiento de jurisdicción y heartbeats |
| `backend/src/test/java/ar/com/planillero/supervision/SupervisionControllerTest.java` | crear | Pruebas de integración MockMvc con seguridad, RBAC y prueba de carga analítica |

### frontend/

| Archivo | Acción | Para qué |
|---|---|---|
| `frontend/src/status/useHeartbeat.ts` | crear | Hook/servicio para emisión periódica de latidos con telemetría (batería, red, GPS) |
| `frontend/src/status/useHeartbeat.test.ts` | crear | Tests unitarios del servicio de latidos y manejo de fallos silenciosos |
| `frontend/src/app/(app)/_layout.tsx` (o componente principal de ruta) | modificar | Activar el hook de heartbeat en sesión de operador |

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `backoffice/src/app/core/models/supervision.model.ts` | crear | Interfaces TypeScript para KPIs, operadores en vivo y excepciones |
| `backoffice/src/app/core/services/supervision.service.ts` | crear | Servicio Angular HttpClient para endpoints de supervisión |
| `backoffice/src/app/pages/supervision/supervision.ts` | crear | Componente principal de supervisión (Signals, KPIs, grilla y polling) |
| `backoffice/src/app/pages/supervision/supervision.html` | crear | Template accesible y minimalista (Heurística 8 UX) con tarjetas destacadas |
| `backoffice/src/app/pages/supervision/supervision.scss` | crear | Estilos visuales del tablero, badges de estado y panel de alertas |
| `backoffice/src/app/pages/supervision/supervision-map/supervision-map.ts` | crear | Componente de mapa Leaflet/OSM operativo para operadores y visitas |
| `backoffice/src/app/pages/supervision/supervision-map/supervision-map.html` | crear | Canvas y contenedor de mapa Leaflet |
| `backoffice/src/app/pages/supervision/supervision-map/supervision-map.scss` | crear | Estilos del mapa y popups informativos |
| `backoffice/src/app/pages/supervision/supervision.spec.ts` | crear | Pruebas unitarias de componentes de supervisión, KPIs y polling |
| `backoffice/src/app/app.routes.ts` | modificar | Declaración de ruta `/supervision` con guardias de rol `SUPERVISOR`/`ADMINISTRATOR` |
| `backoffice/src/app/pages/home/home.html` | modificar | Enlace directo al Tablero de Supervisión en el inicio de la app |

## Decisiones técnicas

- **Estructura de Turnos (`visits.operator_shifts`)** — Se descartó depender exclusivamente del log de visitas iniciadas porque no permitiría detectar operadores que iniciaron su jornada pero aún no comenzaron ninguna visita, ni distinguir la telemetría (batería/red) fuera de los momentos de check-in de una visita.
- **Polling HTTP (30s/60s) en lugar de WebSockets** — Se descartó WebSockets/SSE porque la especificación funcional y el requerimiento de Jira solicitan expresamente polling HTTP ("visualización global del turno operativo mediante Polling HTTP"). El polling HTTP es resiliente ante reconexiones y simplifica la infraestructura de balanceo de carga.
- **Detección Automática de `DEMORADO` y `OFFLINE` en backend** — Se descartó calcular estos estados exclusivamente en el cliente frontend para asegurar que el resumen analítico (`tablero-resumen`) y los KPIs sean determinísticos y consistentes tanto en consultas de supervisión como en auditorías o exportaciones.
- **Aislamiento Multi-tenant por Jurisdicción (OWASP A01)** — Se valida la jurisdicción del usuario autenticado en cada consulta de servicio: un supervisor con `ZONA_NORTE` sólo recibe operadores y visitas de `ZONA_NORTE`, mientras que usuarios con jurisdicción `GLOBAL` (ej. administrador central) acceden a la vista global consolidada.

## Contrato de API

| Método | Ruta | Request | Response |
|---|---|---|---|
| `GET` | `/api/v1/supervision/tablero-resumen?date=YYYY-MM-DD` | Ninguno | `DashboardSummaryDto` (KPIs de operadores, visitas, cumplimiento SLA y alertas destacadas) |
| `GET` | `/api/v1/supervision/operadores/estado?date=YYYY-MM-DD` | Ninguno | `List<OperatorStatusDto>` (grilla detallada con telemetría, estado de turno, progreso y visita activa) |
| `POST` | `/api/v1/supervision/heartbeat` | `HeartbeatRequest` (`batteryLevel`, `networkStatus`, `latitude`, `longitude`) | `200 OK` (`HeartbeatResponse`) |

## Supuestos

- `NO-RIESGO` — Los operadores de demo asignados en `ZONA_NORTE` (`operador.demo`, `operador.norte2`) son suficientes para demostrar los distintos estados del tablero en desarrollo con datos seed.
- `NO-RIESGO` — Leaflet versión 1.9.4 ya instalada en `backoffice` es compatible con Angular 22 y se reutiliza el mismo patrón de carga de iconos y capas base de OpenStreetMap implementado en `route-map`.
- `NO-RIESGO` — Si el dispositivo móvil no tiene permisos de GPS otorgados, el heartbeat se enviará igualmente informando nivel de batería y conectividad con coordenadas nulas.

## Cómo se prueba

1. **Backend:**
   - `./mvnw test -Dtest=SupervisionServiceTest,SupervisionControllerTest`
   - Validación de seguridad multi-tenant: el supervisor de `ZONA_NORTE` consulta el tablero y recibe sólo operadores de su zona; una consulta simulando otro usuario no filtra datos ajenos.
   - Prueba de carga básica o benchmarks de ejecución sobre endpoints analíticos con índices compuestos.
2. **Frontend Móvil:**
   - `npm test -- src/status/useHeartbeat.test.ts`
   - Verificación de emisor de latido cada intervalo y manejo ante desconexión de red.
3. **Backoffice Web:**
   - `npm test -- src/app/pages/supervision/supervision.spec.ts`
   - `npm run build` para chequeo estricto de tipos de TypeScript y templates de Angular.
   - `npm run lint` para validación de estilo y mejores prácticas.
4. **Gates completos del harness:**
   - `node .agents/scripts/verificar.mjs --tarea PLAN-12`
