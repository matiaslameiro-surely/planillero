# PLAN-12 — TASK-11: Tablero Central de Supervisión, Mapa Operativo y Monitoreo de Excepciones

## Contexto y problema

El sistema Planillero cuenta actualmente con capacidades de planificación y asignación de rutas (PLAN-8), inicio georreferenciado de visitas desde la app móvil (PLAN-9) y registro inmutable de evidencias (PLAN-10). Sin embargo, el supervisor central ("Planillero Central") carece de un centro de comando unificado en tiempo real que le permita monitorear el avance del turno operativo, visualizar geográficamente la flota de operadores en terreno, detectar desvíos de SLAs y actuar ante anomalías o excepciones.

Actualmente, para conocer el estado de la operación un supervisor debe consultar individualmente las hojas de ruta o esperar la sincronización diferida al final del día. La falta de latidos periódicos (heartbeats) impide distinguir entre un operador desconectado por falta de cobertura, uno demorado en una visita crítica o uno que ya completó su turno.

Esta tarea implementa el Tablero Central de Supervisión Fullstack:
1. **Backend (Spring Boot + PostgreSQL):** Endpoints analíticos optimizados (`GET /api/v1/supervision/tablero-resumen`, `GET /api/v1/supervision/operadores/estado`) con soporte multi-tenant por jurisdicción (OWASP A01), ingesta de latidos periódicos de operadores (`POST /api/v1/supervision/heartbeat`), tabla de persistencia de turnos de operadores con índices compuestos de alto rendimiento y detección automática de estados operativos (`EN_CAMPO`, `DEMORADO`, `OFFLINE`, `TURNO_COMPLETO`).
2. **Frontend Web (Angular - Backoffice):** Pantalla principal de supervisión y centro de operaciones accesible para supervisores y administradores, con tarjetas de KPIs (total operadores, activos, demorados, offline, turnos completos, % cumplimiento de SLA), tarjetas destacadas para operadores en excepción/fuera de SLA (Heurística UX 8: minimalismo y foco), grilla reactiva filtrable de operadores con estados en vivo, mapa interactivo (Leaflet/OSM) con marcadores diferenciados de operadores y visitas, mecanismo de polling periódico (30s/60s) con botón manual de refresco inmediato y sanitización estricta contra XSS al desplegar observaciones.
3. **Frontend Móvil (React Native + Expo):** Servicio/hook periódico de latido operativo (Heartbeat/Ping) que reporta periódicamente nivel de batería, estado de conectividad de red y coordenadas geográficas sin bloquear el hilo principal ni degradar la experiencia offline del operador.

## Alcance

**Repos que toca:** `backend`, `frontend`, `backoffice`

## Criterios de aceptación

### 1. Base de Datos y Persistencia (PostgreSQL)
1.1. Se crea la migración Flyway `V11__supervision_and_shifts.sql` en el backend:
- Tabla `visits.operator_shifts` (con vista o sinónimo `visits.operador_turnos` para compatibilidad de nomenclatura de dominio):
  - `id`: UUID clave primaria.
  - `operator_id`: UUID con referencia a `core.users(id)`.
  - `shift_date`: DATE fecha del turno operativo.
  - `jurisdiction`: VARCHAR(80) jurisdicción del turno.
  - `status`: VARCHAR(30) estado operativo (`EN_CAMPO`, `DEMORADO`, `OFFLINE`, `TURNO_COMPLETO`).
  - `started_at`: TIMESTAMPTZ hora de inicio del turno.
  - `ended_at`: TIMESTAMPTZ hora de finalización del turno (nulable si está activo).
  - `last_heartbeat_at`: TIMESTAMPTZ fecha y hora del último latido recibido.
  - `last_latitude`: NUMERIC(9,6) última latitud reportada.
  - `last_longitude`: NUMERIC(9,6) última longitud reportada.
  - `battery_level`: NUMERIC(4,2) nivel de batería de 0.00 a 1.00 (o porcentaje).
  - `network_status`: VARCHAR(30) conectividad (`ONLINE`, `OFFLINE`, `UNKNOWN`).
  - `observations`: TEXT notas o detalle de excepciones operativas.
  - Restricción única sobre `(operator_id, shift_date)`.
- Índices compuestos de optimización analítica:
  - `idx_operator_shifts_jurisdiction_date_status` sobre `visits.operator_shifts (jurisdiction, shift_date, status)`.
  - `idx_visits_jurisdiction_status_created` sobre `visits.visits (jurisdiction, status, created_at)`.
  - `idx_route_sheets_date_operator` sobre `visits.route_sheets (route_date, operator_id)`.
- Datos seed de desarrollo ficticios (usuarios y visitas de demo asignadas a operadores en distintas etapas de turno: en campo, demorado, offline, turno completo).

### 2. Backend: Endpoints analíticos y Heartbeat (Spring Boot)
2.1. Ingesta de latidos: Endpoint `POST /api/v1/supervision/heartbeat`:
- Accesible con rol `OPERATOR`.
- Registra o actualiza el latido del operador autenticado para la fecha actual en `operator_shifts`:
  - Actualiza `last_heartbeat_at` al reloj del servidor (`Instant.now()`).
  - Actualiza `battery_level`, `network_status`, `last_latitude`, `last_longitude`.
  - Si no existe turno para el día, lo inicializa automáticamente en estado `EN_CAMPO` con `started_at = now()`.
  - Si la última visita en curso supera el SLA estimado (ej. > 45 minutos sin finalizar), marca el estado como `DEMORADO`.
2.2. Resumen analítico del tablero: Endpoint `GET /api/v1/supervision/tablero-resumen`:
- Accesible para roles `SUPERVISOR` y `ADMINISTRATOR`.
- Admite parámetro opcional `date` (por defecto la fecha actual).
- Aplica filtro estricto por jurisdicción del supervisor autenticado (OWASP A01). Si el usuario tiene jurisdicción `GLOBAL` (admin), permite ver todas o filtrar por jurisdicción.
- Devuelve métricas KPI consolidadas:
  - `totalOperators`: cantidad total de operadores asignados con hoja de ruta en la fecha.
  - `inFieldOperators`: operadores actualmente en campo (`EN_CAMPO`).
  - `delayedOperators`: operadores con demoras o fuera de SLA (`DEMORADO`).
  - `offlineOperators`: operadores sin latido reciente en más de 10 minutos (`OFFLINE`).
  - `completedShiftOperators`: operadores que finalizaron todas sus visitas (`TURNO_COMPLETO`).
  - `totalVisits`, `pendingVisits`, `inProgressVisits`, `completedVisits`.
  - `slaComplianceRate`: porcentaje de cumplimiento de visitas en tiempo (0 a 100%).
  - `exceptions`: lista de incidentes o alertas destacadas para supervisión inmediata (operadores demorados, batería baja crítica < 15%, o visitas fuera de tiempo).
2.3. Estado detallado de operadores: Endpoint `GET /api/v1/supervision/operadores/estado`:
- Accesible para `SUPERVISOR` y `ADMINISTRATOR`.
- Filtro por jurisdicción estricto.
- Devuelve el listado reactivo de operadores con:
  - Identificación (`operatorId`, `username`).
  - Estado del turno (`status`: `EN_CAMPO`, `DEMORADO`, `OFFLINE`, `TURNO_COMPLETO`).
  - Ubicación (`lastLatitude`, `lastLongitude`, `lastHeartbeatAt`).
  - Telemetría (`batteryLevel`, `networkStatus`).
  - Progreso (`assignedVisitsCount`, `completedVisitsCount`).
  - Visita activa (código, dirección, tiempo transcurrido en minutos, estado de SLA).
  - Observaciones y excepciones.
2.4. Seguridad y Sanitización:
- Validación horizontal de jurisdicción (OWASP A01). Un supervisor de `ZONA_NORTE` no puede ver ni recibir datos de `ZONA_SUR`.
- Sanitización de salidas de texto de observaciones ante riesgo de inyección HTML/XSS.

### 3. Frontend Web / Backoffice (Angular)
3.1. Pantalla principal de Supervisión (`/supervision` o `/tablero`):
- Accesible en el menú de navegación para usuarios con rol `SUPERVISOR` o `ADMINISTRATOR`.
- Protegida por guardia de autenticación y autorización de roles.
3.2. Tarjetas de KPIs y Monitoreo de Excepciones:
- Fila superior de tarjetas métricas con estilo corporativo y semántica de colores (Total operadores, En Campo [azul/verde], Demorados [ámbar/rojo], Offline [gris], Turno Completo [verde], % Cumplimiento SLA).
- Sección visual destacada para operadores fuera de SLA o con excepciones críticas (Heurística UX 8: minimalismo y foco en problemas urgentes).
3.3. Grilla reactiva de operadores:
- Visualiza todos los operadores de la jurisdicción con badges de estado.
- Vocabulario y estados homogéneos con el cliente móvil (Heurística UX 4: consistencia y estándares):
  - `En campo` / `En ruta`
  - `Demorado`
  - `Offline`
  - `Turno completo`
- Muestra porcentaje de batería (con alerta visual si es baja < 20%), última conexión hace X minutos y progreso de visitas (ej. 3/5 completadas).
- Permite seleccionar un operador para centrarlo y resaltarlo en el mapa.
3.4. Mapa Operativo Interactivo (Leaflet + OpenStreetMap):
- Componente interactivo que dibuja la posición geográfica actual de cada operador (marcador con icono representativo según estado) y las visitas del día.
- Popups contextuales con código de visita, operador asignado, estado y tiempo transcurrido.
- Ajuste automático de límites (fitBounds) al cargar los marcadores.
3.5. Polling HTTP y Refresco Manual:
- Selector de frecuencia de refresco automático: 30 segundos, 60 segundos o desactivado.
- Botón manual "Actualizar ahora" con spinner de carga y cartel de "Última actualización: HH:mm:ss".
- Destrucción segura del polling en `ngOnDestroy` (evitando fugas de memoria).
3.6. Ciberseguridad UI:
- Sanitización estricta al renderizar observaciones y textos de operadores para prevenir inyección XSS.

### 4. Frontend Móvil (React Native + Expo)
4.1. Servicio / Hook de Latido Periódico (`heartbeat`):
- Hook o servicio en segundo plano/sesión activa que lee el estado de batería y conectividad mediante `useDeviceStatus` y `expo-location`.
- Envía periódicamente (ej. cada 60 segundos mientras la app está activa) un ping a `POST /api/v1/supervision/heartbeat` con el token JWT del operador autenticado.
- Si no hay conectividad o falla el envío, no interrumpe al usuario ni muestra errores intrusivos; reintenta silenciosamente en el siguiente ciclo.
- Vocabulario consistente de estados con el resto del sistema (`en ruta`, `en curso`, `cerrada local`, `sincronizada`, `observada`).

### 5. Testing y Verificación
5.1. Backend:
- Tests unitarios y de integración para `SupervisionService` y `SupervisionController`.
- Tests de control de acceso horizontal por jurisdicción (OWASP A01).
- Pruebas de performance/carga simulada sobre las consultas analíticas de tablero y estado de operadores.
5.2. Backoffice:
- Tests de componentes de la pantalla de supervisión (`supervision.spec.ts`) validando renderizado de KPIs, tarjetas de excepción, grilla de operadores y control de polling.
5.3. Frontend Móvil:
- Tests unitarios para el servicio/hook de latido verificando que procese batería, conectividad y latitud/longitud sin lanzar excepciones.

## Fuera de alcance

- Envío de notificaciones Push remotas (FCM / APNs) a operadores en esta tarea (se reserva para el módulo de mensajería).
- Geofencing automático con alarmas perimetrales en tiempo real mediante websockets (el diseño utiliza Polling HTTP 30s/60s por especificación explícita del issue).
- Edición o reasignación en caliente de hojas de ruta desde el mapa de supervisión (la asignación pertenece al módulo PLAN-8).

## Preguntas abiertas

- [ ] `NO-BLOQUEANTE` Intervalo por defecto de polling en Backoffice: se establece en 30 segundos por defecto con opción de alternar a 60 segundos o refresco manual.
- [ ] `NO-BLOQUEANTE` Umbral para considerar un operador como `OFFLINE`: se establece en 10 minutos sin recibir latidos mientras su turno esté abierto.
- [ ] `NO-BLOQUEANTE` Umbral para considerar un operador como `DEMORADO`: se establece cuando una visita en curso excede 45 minutos o la hora estimada de atención ha expirado.
