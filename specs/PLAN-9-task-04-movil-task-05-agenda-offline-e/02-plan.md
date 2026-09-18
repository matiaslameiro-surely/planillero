# Plan técnico — PLAN-9 (Etapa 1: piezas móviles independientes de PLAN-8)

Este plan cubre **sólo la etapa 1** de `01-spec.md`, únicamente en `frontend`. La etapa 2 (agenda, pantalla
"Hoja de Ruta", endpoint de inicio y columnas en `visitas`) se planifica cuando PLAN-8 defina el esquema.

## Enfoque

Se construyen como módulos chicos y probables por separado, sin pantallas conectadas a datos, para que la
etapa 2 sólo tenga que enchufarlos:

- `accuracy.ts`: función pura que traduce metros de precisión a color del semáforo.
- `location.ts`: pide permiso, captura la ubicación con `expo-location` y rechaza las lecturas marcadas como
  simuladas (`mocked`).
- `DeviceStatusBar`: barra fija con modo offline/conectado, batería, estado del GPS y contador de pendientes
  (recibido por prop, para no depender de la agenda).
- `db/`: apertura de SQLite con SQLCipher y gestión de la clave de cifrado, sin tablas de negocio.

Todo el código nuevo va en `src/visit/`, `src/status/` y `src/db/`, siguiendo la organización por dominio que ya
usa `src/auth/` y `src/api/`. Nombres en inglés, comentarios en español.

## Archivos a tocar

### frontend/

| Archivo | Acción | Para qué |
|---|---|---|
| `package.json` / `package-lock.json` | modificar | Agregar `expo-location`, `expo-battery`, `expo-network`, `expo-sqlite`, con versiones resueltas por `npx expo install` |
| `app.json` | modificar | Plugins: permisos de ubicación y `expo-sqlite` con `useSQLCipher: true` |
| `src/visit/accuracy.ts` | crear | Semáforo de precisión (verde < 15 m, amarillo 15–50 m, rojo > 50 m) |
| `src/visit/accuracy.test.ts` | crear | Bordes: 14.9, 15, 50, 50.1, valores inválidos |
| `src/visit/location.ts` | crear | Captura de ubicación, permisos y rechazo de ubicación simulada |
| `src/visit/location.test.ts` | crear | Proveedor mockeado: lectura válida, mock location, permiso denegado, sin fix |
| `src/status/useDeviceStatus.ts` | crear | Hook: conectividad, batería y permiso/estado del GPS |
| `src/components/DeviceStatusBar.tsx` | crear | Barra fija de estado; objetivos táctiles ≥ 48×48 dp |
| `src/components/DeviceStatusBar.test.tsx` | crear | Render en modo offline y conectado, con y sin pendientes |
| `src/db/encryptionKey.ts` | crear | Genera y resguarda la clave de cifrado en `expo-secure-store` |
| `src/db/encryptionKey.test.ts` | crear | Se genera una vez, se reutiliza y no se guarda en claro fuera del almacén seguro |
| `src/db/database.ts` | crear | Abre SQLite y aplica `PRAGMA key` con la clave |

13 archivos: supera `limiteArchivosSinCheckpoint` (12), pero `plan` ya está en `flujo.checkpoints`, así que el
checkpoint se hace de todos modos.

## Decisiones técnicas

- **`expo-sqlite` con SQLCipher** — Se descartó `op-sqlite` y `WatermelonDB` porque el esqueleto ya es Expo
  y `expo-sqlite` trae soporte de SQLCipher por config plugin, sin un módulo nativo aparte. Se descartó
  cifrar los campos a mano sobre SQLite común porque deja índices y metadatos al descubierto.
- **Clave aleatoria de 256 bits guardada en `expo-secure-store`** — Se descartó derivarla de la contraseña o
  de la sesión, como sugiere el backlog, porque la sesión rota con cada refresh y la contraseña no se
  conserva: cualquier derivación dejaría la base ilegible tras reloguear. La clave queda vinculada al
  dispositivo (Keystore/Keychain) y a un usuario si se guarda por `userId`.
- **Rechazar la ubicación simulada en el cliente con `location.mocked`** — Se descartó sólo confiar en el
  servidor porque el backend no puede distinguir un fix simulado. Es una defensa parcial: no cubre iOS ni un
  dispositivo con root. Se documenta como tal en el código.
- **`expo-network` y `expo-battery`** — Se descartó `@react-native-community/netinfo` para no sumar un módulo
  nativo fuera del ecosistema Expo.
- **Semáforo como función pura** — Se descartó calcularlo dentro del componente para poder probar los bordes
  sin renderizar nada.

## Contrato de API

No aplica a la etapa 1: no se consume ni se define ningún endpoint. El contrato de
`POST /api/v1/visitas/{id}/iniciar` y de la agenda pertenece a la etapa 2.

## Supuestos

- `RIESGO` `expo-sqlite` con SQLCipher exige un **development build**: no anda en Expo Go. Si el equipo
  necesita seguir con Expo Go, hay que cambiar el enfoque de cifrado.
- `RIESGO` `Location.getCurrentPositionAsync` expone `mocked` en Android. Si en la versión de Expo que
  resuelva `expo install` no está o cambió de nombre, la detección hay que rehacerla. Se verifica al instalar.
- `RIESGO` En los tests de Jest no se puede ejecutar SQLCipher real (es código nativo). Los tests de `db/`
  cubren la gestión de la clave y mockean `expo-sqlite`; el cifrado efectivo sólo se comprueba en un
  dispositivo o emulador con un development build.
- El operador concede el permiso de ubicación en primer plano; no se pide ubicación en segundo plano.
- Las versiones de las dependencias nuevas salen de `npx expo install`, no de números escritos a mano.
- El branch de PLAN-10 (evidencias) también toca `frontend/src/api/client.ts`; este plan **no** modifica ese
  archivo, así que no debería haber conflicto.

## Cómo se prueba

- `npm run lint`, `npx tsc --noEmit` y `npm test -- --watchAll=false` en `frontend/`.
- Los tests unitarios cubren los criterios 8 a 12 en lo que toca a las piezas de la etapa 1.
- Prueba manual, fuera de los gates: un development build en un Android real con una app de ubicación
  simulada activada, para comprobar el rechazo del criterio 10 y que el archivo SQLite no se abre con un
  cliente SQLite común (criterio 7).

---

# Etapa 2 — Agenda offline, inicio de visita y endpoints del backend

**Se implementa cuando el PR #6 de PLAN-8 esté mergeado en `main`.** Este plan asume el esquema y el código de
esa rama tal como estaban el 2026-09-18 (migración todavía como `V4__route_scheduling.sql`, a renumerar a V7).
Al empezar hay que releer `main` y confirmar los supuestos marcados abajo.

## Enfoque

El backend suma dos cosas sobre lo que deja PLAN-8: la agenda del propio operador y el inicio de visita. El
inicio es una transición `ASSIGNED → IN_PROGRESS` que guarda la evidencia de presencia (GPS + doble reloj) en
la misma fila de `visits.visits`, bajo un bloqueo de fila para que dos pedidos simultáneos no se pisen.

El móvil usa SQLite cifrada como **única fuente de lo que se muestra**: la pantalla nunca lee de la red. Al
abrir la agenda, si hay conexión, se baja el día y se vuelca a SQLite en una transacción; después la pantalla
lee de SQLite. Así el modo offline no es un caso aparte: es el mismo camino sin el paso de sincronizar.

## Archivos a tocar

### backend/

| Archivo | Acción | Para qué |
|---|---|---|
| `db/migration/V8__visit_start.sql` | crear | Columnas de inicio, `IN_PROGRESS` en el `CHECK` y restricciones de consistencia |
| `planning/VisitStatus.java` | modificar | Agregar `IN_PROGRESS` |
| `planning/Visit.java` | modificar | Campos de inicio y método `start(...)` que valida la transición |
| `planning/VisitRepository.java` | modificar | `findByIdForUpdate` con `PESSIMISTIC_WRITE` |
| `planning/RouteSheetRepository.java` | modificar | `existsByOperatorIdAndVisitId` para el control de acceso horizontal |
| `planning/DriftCalculator.java` | crear | Cálculo puro de `driftSeconds` |
| `planning/dto/StartVisitRequest.java` | crear | Body validado del inicio |
| `planning/dto/StartVisitResponse.java` | crear | Respuesta del inicio |
| `planning/VisitStartService.java` | crear | Reglas del inicio: existencia, asignación, estado, reloj |
| `planning/VisitStartController.java` | crear | `POST /api/v1/visits/{id}/start`, sólo `OPERATOR` |
| `planning/PlanningService.java` | modificar | `mySheet(username, date)` reusando `routeSheet` |
| `planning/PlanningController.java` | modificar | `GET /api/v1/operators/me/route-sheet`, sólo `OPERATOR` |
| `common/ClockConfig.java` | crear | Bean `Clock` del sistema, inyectable y sustituible en tests |
| `test/.../DriftCalculatorTest.java` | crear | Atrasado, adelantado, sin desfase y fracción de segundo |
| `test/.../VisitStartIntegrationTest.java` | crear | Criterios 1 a 7 contra PostgreSQL real |

15 archivos entre código y tests. Más `03-contrato-api.md` en `specs/`.

### frontend/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/api/visits.ts` | crear | `getMyRouteSheet(date)` y `startVisit(id, payload)` sobre `requestWithAuth` |
| `src/api/visits.test.ts` | crear | Forma de los pedidos y traducción de errores |
| `src/db/agendaSchema.ts` | crear | Tablas locales y versionado con `PRAGMA user_version` |
| `src/db/DatabaseProvider.tsx` | crear | Abre la base del operador logueado y la comparte por contexto |
| `src/agenda/agendaRepository.ts` | crear | Volcar un día en transacción, listar, contar pendientes, marcar iniciada |
| `src/agenda/agendaRepository.test.ts` | crear | Mapeo y orden; el SQL se ejercita con un doble de base |
| `src/agenda/useAgenda.ts` | crear | Lee de SQLite y, con conexión, sincroniza el día |
| `src/visit/startVisit.ts` | crear | Orquesta: capturar ubicación, enviar, actualizar SQLite |
| `src/visit/startVisit.test.ts` | crear | Éxito y cada tipo de falla, sin cambiar SQLite ante un error |
| `src/components/VisitCard.tsx` | crear | Tarjeta con el botón "Iniciar Visita" (≥ 48×48 dp) |
| `src/components/LocationSummary.tsx` | crear | Bloque no editable con lat, lon, precisión con semáforo y hora |
| `src/components/LocationSummary.test.tsx` | crear | Colores del semáforo y datos visibles |
| `src/app/agenda.tsx` | crear | Pantalla "Hoja de Ruta" con la barra de estado fija |
| `src/app/_layout.tsx` | modificar | Montar `DatabaseProvider` dentro de `SessionProvider` |
| `src/app/index.tsx` | modificar | Entrada a la agenda desde el inicio |

15 archivos. Antes de empezar: rebasear la rama sobre `main` para tener `requestWithAuth` (PLAN-10 lo agregó).

## Decisiones técnicas

- **Bloqueo pesimista de la fila de la visita** — Se descartó un `UPDATE ... WHERE status = 'ASSIGNED'` condicional
  porque obliga a releer la entidad y a interpretar el conteo de filas; con `PESSIMISTIC_WRITE` el segundo
  pedido espera, ve `IN_PROGRESS` y responde 409 con la misma lógica de validación que el primero. Se
  descartó el bloqueo optimista porque el conflicto es esperable (doble toque en el botón) y no excepcional.
- **Los datos del inicio viven en `visits.visits`** — Se descartó una tabla aparte `visit_starts` porque hay un
  único inicio por visita y el tablero del supervisor los va a leer junto con la visita. Si en el futuro una
  visita pudiera reiniciarse, esa decisión se revisa.
- **`Clock` inyectable en lugar de `Instant.now()` directo** — Sin eso el test del desfase depende del reloj real.
- **Cálculo del desfase en una clase pura** — Se descartó dejarlo dentro del servicio para probar los bordes sin
  Spring ni base de datos.
- **Redondeo al segundo más cercano** — Se descartó truncar, porque un desfase de −0.6 s y uno de −0.4 s no
  deberían dar el mismo valor y truncar sesga hacia cero.
- **403 (`visit_not_assigned`) y no 404 para una visita ajena** — Es coherente con `outside_jurisdiction` de PLAN-8.
  Filtra que la visita existe; se acepta porque los códigos de visita no son secretos para un operador de la
  misma empresa, y un 404 haría más difícil depurar una asignación mal hecha.
- **Restricción de la migración robusta al nombre** — Se descartó `drop constraint visits_status_check` a ciegas:
  se busca el `CHECK` sobre `status` en `pg_constraint` y se reemplaza, así no depende del nombre autogenerado.
- **SQLite como única fuente de la pantalla** — Se descartó mostrar la respuesta de red directamente y usar
  SQLite sólo como caché de respaldo, porque son dos caminos de renderizado que pueden divergir y el offline
  quedaría menos probado.
- **Reemplazo transaccional del día** — Se descartó un upsert fila a fila porque no elimina las visitas que el
  supervisor reasignó a otro operador; borrar y volver a insertar el día dentro de una transacción sí.
- **`DatabaseProvider` en el layout** — Se descartó abrir la base dentro de cada pantalla porque abriría
  conexiones repetidas y complicaría cerrarla al salir de sesión.
- **Iniciar visita exige conexión** — Se descartó encolarlo localmente porque eso es la sincronización con
  idempotencia de PLAN-14, con sus propios riesgos (reintentos, duplicados).

## Contrato de API

Definitivo en `03-contrato-api.md`, que emite el backend antes de que el móvil lo consuma.

| Método | Ruta | Request | Response |
|---|---|---|---|
| GET | `/api/v1/operators/me/route-sheet?date=YYYY-MM-DD` | — | `RouteSheetDto` de PLAN-8: `operatorId`, `operatorUsername`, `date`, `items[{position, visit{id, code, address, latitude, longitude, status, urgency}}]` |
| POST | `/api/v1/visits/{id}/start` | `{latitude, longitude, accuracyMeters, clientTimestamp}` | `{visitId, status, startedAtDevice, startedAtServer, driftSeconds}` |

Errores del `POST`: 400 `invalid_request`, 401, 403 `forbidden` o `visit_not_assigned`, 404 `visit_not_found`,
409 `visit_not_startable`. Del `GET`: 400, 401, 403.

## Supuestos

- `RIESGO` El PR #6 de PLAN-8 se mergea **con las tablas `visits.visits` y `visits.route_sheets` tal como están
  hoy en su rama**, y con la migración renumerada a V7. Si Juan Ignacio cambia nombres de columnas o de tablas
  en la revisión, el plan de backend se corrige antes de tocar código.
- `RIESGO` `ApiException.forbidden(...)` y `ApiException.notFound(...)` llegan a `main` con PLAN-8: hoy `main` no
  las tiene y este plan las usa. Lo mismo vale para el módulo `planning` completo.
- `RIESGO` Los tests de integración necesitan **Docker Desktop encendido** (Testcontainers). Sin Docker no se
  pueden verificar los criterios 1 a 7 en esta máquina.
- El `CHECK` de `status` de PLAN-8 es el único sobre esa columna y se puede reemplazar sin tocar datos.
- Cualquier operador puede iniciar una visita de cualquier fecha de sus hojas de ruta (ver pregunta abierta).
- Un operador tiene a lo sumo una hoja de ruta con una visita dada (la unicidad `(visit_id, route_date)` de
  PLAN-8 lo permite entre fechas distintas): basta con que exista alguna.
- El JSON usa `camelCase`; los `Instant` viajan en ISO-8601 con zona (`Z`), como los serializa Jackson por
  defecto en Spring Boot.
- La zona horaria del móvil define "hoy"; el servidor guarda todo en UTC (`timestamptz`).
- Los seeds de PLAN-8 (`operador.demo`, visitas `V-1001`…) sirven para probar; no se agregan datos nuevos.

## Cómo se prueba

- Backend: `mvnw -B test` con Docker encendido. `DriftCalculatorTest` y `VisitStartIntegrationTest` cubren los
  criterios 1 a 7, incluida una prueba de concurrencia con dos pedidos simultáneos.
- Frontend: `npm run lint`, `npx tsc --noEmit` y `npm test -- --watchAll=false`.
- Prueba manual en un development build con el backend levantado (`docker-compose` del backend) y un Android
  real: login como `operador.demo`, sincronizar la agenda, cortar la red, comprobar que la pantalla muestra lo
  mismo, volver a conectar, iniciar una visita y ver el bloque con el semáforo. Con una app de ubicación
  simulada activada, comprobar que el inicio se rechaza.
