# Plan técnico — PLAN-8

> Asignación y planificación de rutas. Alcance: `backend` + `backoffice`.

## Enfoque

Se construye el primer módulo de negocio del proyecto sobre la base de PLAN-6: el **backend** define
el contrato del dominio (operadores, visitas y hojas de ruta) en una migración nueva (`V4`, esquema
`visits`) y cuatro endpoints REST protegidos con rol `SUPERVISOR`, y el **backoffice** consume ese
contrato en una pantalla nueva de planificación con grilla propia, filtros y mapa Leaflet.

El modelo de **jurisdicción** (la parte de OWASP A01) se resuelve agregando una columna a
`core.users`: supervisor y operador comparten zona, y toda consulta/asignación se recorta a la zona
del supervisor autenticado — en el backend vía service, nunca confiando solo en el `@PreAuthorize`.

La clave de diseño: **el mapa no es el productor de datos**. La grilla y la asignación funcionan sin
mapa; el mapa solo dibuja los marcadores de la hoja de ruta ya asignada. Así el alcance web no se
contagia de depender de la disponibilidad de tiles.

## Archivos a tocar

### backend/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/main/resources/db/migration/V4__route_scheduling.sql` | crear | Esquema `visits` (tablas `visits` y `route_sheets` con índices), columna `core.users.jurisdiction` y seed ficticio |
| `src/main/java/ar/com/planillero/user/User.java` | modificar | Campo `jurisdiction` (mapeado a `core.users`) |
| `src/main/java/ar/com/planillero/user/UserRepository.java` | modificar | `findByRoles_Name(RoleName)` para listar operadores por jurisdicción |
| `src/main/java/ar/com/planillero/planning/VisitStatus.java` | crear | Enum de estado de visita (`PENDING`, `ASSIGNED`, `COMPLETED`, `CANCELLED`) |
| `src/main/java/ar/com/planillero/planning/VisitUrgency.java` | crear | Enum de urgencia (`LOW`, `MEDIUM`, `HIGH`) |
| `src/main/java/ar/com/planillero/planning/Visit.java` | crear | Entidad JPA de la tabla `visits` |
| `src/main/java/ar/com/planillero/planning/VisitRepository.java` | crear | Acceso a visitas (búsqueda por ids, por jurisdicción/estado/urgencia) |
| `src/main/java/ar/com/planillero/planning/RouteSheet.java` | crear | Entidad JPA de la tabla `route_sheets` |
| `src/main/java/ar/com/planillero/planning/RouteSheetRepository.java` | crear | Acceso a hojas de ruta (por operador+fecha, por visitas+fecha) |
| `src/main/java/ar/com/planillero/planning/dto/OperatorDto.java` | crear | Operador: `id`, `username`, `jurisdiction` |
| `src/main/java/ar/com/planillero/planning/dto/VisitDto.java` | crear | Visita: `id`, `code`, `address`, lat/lng, `status`, `urgency` |
| `src/main/java/ar/com/planillero/planning/dto/RouteSheetDto.java` | crear | Hoja de ruta: operador + fecha + items (visita + `position`) ordenados |
| `src/main/java/ar/com/planillero/planning/dto/AssignRequest.java` | crear | Body de `POST /visits/assign` (`operatorId`, `date`, `visitIds`) con validación |
| `src/main/java/ar/com/planillero/planning/PlanningService.java` | crear | Lógica de negocio: jurisdicción, orden por urgencia, asignación/reasignación |
| `src/main/java/ar/com/planillero/planning/PlanningController.java` | crear | Los 4 endpoints con `@PreAuthorize("hasRole('SUPERVISOR')")` |
| `src/test/java/ar/com/planillero/planning/PlanningIntegrationTest.java` | crear | Integración REST con Testcontainers: 401/403, jurisdicción, orden, reasignación, 400/404 |

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `package.json` | modificar | Dependencia `leaflet` + dev `@types/leaflet` |
| `src/app/core/models/planificacion.model.ts` | crear | Tipos `Operator`, `Visit`, `RouteSheet`, filtros |
| `src/app/core/services/planificacion.service.ts` | crear | Llamadas a los 4 endpoints (patrón de `health.service`) |
| `src/app/core/services/__tests__/planificacion.service.spec.ts` | crear | Tests con `HttpTestingController` |
| `src/app/core/guards/supervisor.guard.ts` | crear | Guard de ruta: sesión + rol `SUPERVISOR` |
| `src/app/core/guards/__tests__/supervisor.guard.spec.ts` | crear | Tests del guard (sin sesión, rol operador, rol supervisor) |
| `src/app/pages/planificacion/route-map.ts` | crear | Componente del mapa Leaflet (marcadores de una hoja de ruta) |
| `src/app/pages/planificacion/route-map.html` | crear | Contenedor `<div>` del mapa |
| `src/app/pages/planificacion/route-map.scss` | crear | Estilos del mapa |
| `src/app/pages/planificacion/planificacion.ts` | crear | Página: fecha, filtros, grilla, asignación, integra el mapa |
| `src/app/pages/planificacion/planificacion.html` | crear | Template de la página |
| `src/app/pages/planificacion/planificacion.scss` | crear | Estilos de la página |
| `src/app/pages/planificacion/__tests__/planificacion.spec.ts` | crear | Tests del componente (Leaflet mockeado) |
| `src/app/pages/planificacion/__tests__/route-map.spec.ts` | crear | Tests del mapa (Leaflet mockeado) |
| `src/app/app.routes.ts` | modificar | Ruta `/planificacion` con `supervisorGuard`, carga diferida |
| `src/app/pages/home/home.ts` | modificar | Helper `isSupervisor()` |
| `src/app/pages/home/home.html` | modificar | Acceso a la planificación visible solo para supervisores |
| `src/styles.scss` | modificar | Import del CSS de Leaflet |

## Decisiones técnicas

- **Nombres en inglés** — Endpoints (`/api/v1/operators`, `/api/v1/visits/assign`) y tablas
  (`visits`, `route_sheets`) en inglés, por convención del proyecto. Se descartó mantener las rutas
  españolas del issue (`/operadores/{id}/hoja-de-ruta`) porque reviven la excepción de PLAN-2/3/4
  (`/salud`) justo cuando la convención ya está fijada; el contrato de `03-contrato-api.md` lo
  documenta para todos los clientes.
- **Reasignación sin endpoint aparte** — `POST /visits/assign` reasigna una visita ya asignada ese
  día a un **operador distinto** (suelta la del anterior). Se descartó un `DELETE /route-sheets`
  explícito: la heurística 7 pide reasignación rápida y no hay borrado como caso de negocio. Asignar
  a un operador que ya la tenía ese mismo día es un no-op → 400 (nada que hacer).
- **Jurisdicción fija del supervisor en `GET /visits`** — los filtros de búsqueda de visitas no
  incluyen `jurisdiction`: siempre es la del usuario autenticado. Se descartó parametrizarlo porque
  una jurisdicción distinta a la propia es exactamente el caso de A01; si algún día hace falta, se
  agrega con su propia validación.
- **Mapa aislado en un componente** — los tests del mapa y de la página mockean el módulo `leaflet`
  (`vi.mock`), así la suite corre en jsdom sin navegador real. Se descartó el mapa inline en la
  página porque imantaría la lógica del mapa a la lógica de datos y rompería la capa de tests.
- **Grilla propia, sin AG-Grid** — los filtros no justifican una dependencia pesada ni su licencia
  (even Community). Se descartó AG-Grid: una tabla propia con `@for`, orden y filtros en memoria
  alcanza para la cantidad de visitas de una zona en un día.
- **Seed zonal ficticio** — una sola zona `ZONA_NORTE` con supervisor y DOS operadores habilita a la
  vez el mapa (varias visitas) y los tests de reasignación; `ZONA_SUR` con su operador y visitas
  habilita el test de acceso horizontal. Las contraseñas de los usuarios de seed son ficticias y
  quedan documentadas (reutilizan hashes bcrypt ya existentes para los nuevos).

## Contrato de API (alto nivel)

| Método | Ruta | Request | Response |
|---|---|---|---|
| `GET` | `/api/v1/operators` | — | `[{ id, username, jurisdiction }]` (solo operadores de la jurisdicción del caller) |
| `GET` | `/api/v1/operators/{operatorId}/route-sheets?date=YYYY-MM-DD` | — | `{ operator, date, items: [{ position, visit: {…} }] }` ordenado por urgencia |
| `GET` | `/api/v1/visits?status=&urgency=&date=&operatorId=` | — | `[{ id, code, address, latitude, longitude, status, urgency }]` (jurisdicción del caller) |
| `POST` | `/api/v1/visits/assign` | `{ operatorId, date, visitIds }` | Hoja de ruta resultante `{ operator, date, items }` |

Todos con autenticación y `hasRole('SUPERVISOR')`. Errores en la forma estándar
`{ error, message }` (400, 401, 403, 404). El detalle definitivo lo emite el backend en
`03-contrato-api.md`.

## Supuestos

- `RIESGO` — **`main` del backend no avanza mientras trabajamos.** Verificado hoy: solo existen
  `V1..V3` y la numeración `V4` está libre. Si PLAN-7/PLAN-9/PLAN-10 mergearan otra migración antes
  que la nuestra, habría que reenumerar; por eso la migración se escribe temprano y se consulta el
  remoto antes de commitear.
- Los nuevos usuarios de seed (`operador.norte2`, `operador.sur`) reutilizan hashes bcrypt de
  desarrollo ya existentes y sus contraseñas se documentan en el propio `.sql` como ficticias.
- Las coordenadas de las visitas de seed son ficticias (zona aproximada de Buenos Aires); el mapa
  puede requerir red para los tiles de OpenStreetMap, pero la grilla y la asignación funcionan sin
  red.
- Los operadores son las mismas entidades `User` con rol `OPERATOR`; no hay tabla separada de
  operadores.
- Una visita puede estar en hojas de ruta de fechas distintas (replanificación), pero no dos veces
  en la misma fecha — garantizado por la unicidad `(visit_id, route_date)`.
- La URL base del backoffice (`environment.apiUrl`) ya apunta al backend y el interceptor adjunta el
  Bearer solo: los nuevos servicios no tocan tokens.

## Cómo se prueba

- Backend: `mvnw -B test` (Testcontainers: la integración levanta PostgreSQL 16, aplica `V1..V4` y
  valida 401/403/404, orden por urgencia, reasignación y acceso horizontal). El arranque con base
  limpia también queda cubierto por los tests de integración de contexto.
- Backoffice: `npm test` (servicio con `HttpTestingController`, guard y componentes con Leaflet
  mockeado), `npm run lint` y `npm run build` (valida templates y tipos-vs-DOM).
- Verificación final con `node .agents/scripts/verificar.mjs --tarea PLAN-8` y revisión
  independiente (`.agents/scripts/revisar.mjs`).