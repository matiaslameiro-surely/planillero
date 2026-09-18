# PLAN-9 — TASK-04 (Móvil) + TASK-05: Agenda Offline e Inicio de Visita con GPS y Timestamps

## Contexto y problema

El operador de campo necesita ver su hoja de ruta sin conexión y, al llegar al domicilio, dejar
constancia fehaciente de su presencia física: coordenadas GPS, precisión del fix y doble referencia
temporal (hora del dispositivo vs. hora del servidor). Lo que se pide es la parte **móvil** de TASK-04
(agenda offline) y TASK-05 (inicio de visita con GPS), más el endpoint del backend que registra el inicio.

El issue de Jira es razonablemente detallado en el "qué", pero **da por existente** la tabla `visitas` y
los datos de la hoja de ruta. Esas piezas las creó **PLAN-8** (Juan Ignacio Urrutia, ya mergeado: PR #6 del
backend y #4 del backoffice). Sus endpoints son sólo para supervisor, así que el operador no puede leer su
propia agenda: eso lo suma PLAN-9. Las rutas de la API van **en inglés**, según la convención del
proyecto y como PLAN-8, y no como las nombra el issue (`/visitas/{id}/iniciar` pasa a
`/visits/{id}/start`).

Decisiones ya acordadas con PLAN-8 (comentario del 2026-09-18 en Jira):

- La migración de PLAN-8 se renumera a **V7** (V4 es de PLAN-10 y V5/V6 de PLAN-7). La de PLAN-9 es **V8**.
- PLAN-9 agrega `GET /api/v1/operators/me/route-sheet?date=` con rol `OPERATOR`, reusando el servicio.
- PLAN-9 agrega el estado `IN_PROGRESS` a `VisitStatus` y al `CHECK` de la tabla, en su migración.
- Vencimiento y SLA quedan **fuera** de PLAN-8 y también de PLAN-9 (ver Fuera de alcance).

## Alcance

**Repos que toca:** `backend`, `frontend` (móvil)

- **backend:** `POST /api/v1/visits/{id}/start`, cálculo de `driftSeconds`, columnas de inicio en
  `visits.visits`, estado `IN_PROGRESS`, y `GET /api/v1/operators/me/route-sheet`.
- **frontend:** pantalla "Hoja de Ruta" leyendo de SQLite cifrada (SQLCipher) y sincronizada con el
  backend cuando hay conexión, botón "Iniciar Visita" con captura de GPS, semáforo de precisión y bloque
  no editable con los datos del inicio.

## Etapas

- **Etapa 1 — hecha (2026-09-18), sólo `frontend`.** Semáforo de precisión, captura de ubicación con
  detección de mock location, barra de estado, base SQLite cifrada con clave en el almacén seguro. Ver
  `02-plan.md`. Commits `7ee9753`, `9902816` y `0237d0e` en la rama de la tarea.
- **Etapa 2 — hecha (2026-09-18), `backend` y `frontend`.** Todo lo demás de esta spec, implementado sobre
  `main` una vez mergeado PLAN-8 con su migración ya renumerada a V7.

## Criterios de aceptación

Los criterios 1 a 7 son de **backend** y los 8 a 12 del **móvil** (etapa 2). Los 13 a 17 son de la etapa 1
(semáforo, ubicación, barra, cifrado), ya cubiertos por tests.

1. `POST /api/v1/visits/{id}/start` con `latitude`, `longitude`, `accuracyMeters` y `clientTimestamp`
   válidos, hecho por el operador al que está asignada la visita, responde 200 con `visitId`, `status`
   (`IN_PROGRESS`), `startedAtDevice`, `startedAtServer` y `driftSeconds`. En la base quedan persistidos
   las coordenadas, la precisión, ambos timestamps, el desfase y quién inició la visita.
2. `driftSeconds` es `startedAtServer − startedAtDevice` en segundos, con signo, redondeado al entero más
   cercano. El reloj del servidor se toma de un `Clock` inyectable. Un test unitario cubre dispositivo
   atrasado, adelantado, sin desfase y un desfase con fracción de segundo.
3. Responde 400 con `error: invalid_request` y el nombre del campo en `message` si falta cualquiera de los
   cuatro campos, si `latitude` no está en [−90, 90], si `longitude` no está en [−180, 180] o si
   `accuracyMeters` es negativo.
4. Responde 401 sin token, 403 si el usuario no tiene rol `OPERATOR`, 404 (`visit_not_found`) si la visita no
   existe y 403 (`visit_not_assigned`) si existe pero no está en una hoja de ruta del operador autenticado
   (control de acceso horizontal, OWASP A01).
5. Iniciar una visita que no está en estado `ASSIGNED` responde 409 (`visit_not_startable`) y **no modifica**
   los datos del primer inicio. Dos pedidos simultáneos sobre la misma visita: uno responde 200 y el otro 409.
6. `GET /api/v1/operators/me/route-sheet?date=YYYY-MM-DD` con rol `OPERATOR` devuelve sólo las visitas de la
   hoja del operador autenticado para esa fecha, ordenadas por posición, con la misma forma que
   `RouteSheetDto` de PLAN-8. Responde 400 si falta `date` o tiene un formato inválido, 403 para un
   supervisor y 401 sin token.
7. La migración V8 amplía el `CHECK` de `status` con `IN_PROGRESS` y agrega las columnas de inicio como
   nulables; las visitas existentes no cambian.

8. La pantalla "Hoja de Ruta" muestra las visitas del día (código, dirección, urgencia y estado) leyendo
   **sólo de SQLite local**. Con la red cortada (modo avión) muestra las mismas tarjetas que con red, y
   indica cuándo fue la última sincronización.
9. Con conexión, al abrir la pantalla se pide la agenda del día al backend y se reemplaza la copia local de esa
   fecha en una sola transacción. Si el pedido falla, se conserva la copia anterior y se avisa.
10. La barra de estado (etapa 1) va fija arriba en la pantalla, con el contador de visitas pendientes
    calculado desde SQLite (visitas en estado `ASSIGNED`).
11. El botón "Iniciar Visita" mide al menos 48×48 dp, está deshabilitado sin conexión con un mensaje que lo
    explica, y sólo aparece en visitas `ASSIGNED`.
12. Al presionarlo se captura la ubicación (etapa 1), se envía al backend, y con la respuesta se muestra un
    bloque **no editable** con latitud, longitud, precisión en metros con su color de semáforo y la hora de
    inicio. La visita pasa a `IN_PROGRESS` en SQLite. Si la captura falla (permiso, GPS apagado, ubicación
    simulada, sin fix) o el backend responde con error, se muestra un mensaje específico y no cambia nada.

13. Semáforo: verde < 15 m, amarillo 15–50 m, rojo > 50 m, con tests de bordes.
14. La captura rechaza ubicaciones simuladas (`mocked`), y también permiso denegado, GPS apagado y falta de fix.
15. La barra de estado muestra modo offline o conectado, batería, GPS y visitas pendientes.
16. La base SQLite local se abre con SQLCipher y una clave aleatoria guardada sólo en el almacén seguro.
17. Los gates (`lint`, `tipos`, `tests`) de cada repo pasan.

## Fuera de alcance

- Módulo web de asignación de rutas y `POST /visits/assign`: es **PLAN-8**.
- Vencimiento y SLA en la tarjeta de agenda: PLAN-8 los dejó afuera y el issue de PLAN-9 no los pide.
- Widget de mapa y ficha del punto GPS en el backoffice (parte web de TASK-05).
- Sincronización diferida de un inicio de visita hecho sin conexión, con idempotencia: es **PLAN-14**
  (Sprint 3). Acá el inicio requiere conexión con el servidor.
- Completar o cerrar una visita, formulario dinámico (TASK-07) y evidencias/firma (TASK-08). La transición
  hacia el formulario queda como punto de enganche, sin implementar.
- Cliente NTP propio: el servidor toma su propio reloj, que se asume sincronizado por infraestructura.
- Descarga de más de un día de agenda: se sincroniza sólo la fecha que se muestra.

## Preguntas abiertas

- [x] `BLOQUEANTE` **Dueño de las tablas `visitas` y `hojas_de_ruta` y del contrato de agenda.** Resuelta el
  2026-09-18 con PLAN-8: sus tablas son `visits.visits` y `visits.route_sheets`, su migración es V7 y la
  de PLAN-9 es V8. PLAN-8 ya está mergeado en `main`.
- [ ] `NO-BLOQUEANTE` ¿Una lectura con precisión **roja** (> 50 m) impide iniciar la visita? Se asume que **no**:
  el semáforo informa y el dato queda registrado para que el supervisor lo vea. Bloquearlo dejaría al
  operador sin poder trabajar en interiores.
- [ ] `NO-BLOQUEANTE` ¿Hay que validar la fecha de la hoja de ruta al iniciar? Se asume que **no**: basta con
  que la visita esté en alguna hoja del operador. Un operador con el reloj mal puesto no debería quedar
  trabado, y el desfase se registra de todos modos.
- [ ] `NO-BLOQUEANTE` ¿La fecha "de hoy" en el móvil sale del reloj del dispositivo? Se asume que sí, en la zona
  horaria del dispositivo.
- [ ] `NO-BLOQUEANTE` Iniciar una visita **sin conexión** no se encola (lo cubre PLAN-14): el botón exige
  conexión con el backend; el GPS sí se captura offline.
- [ ] `NO-BLOQUEANTE` SQLCipher no funciona en Expo Go: exige un development build. Ya adoptado en la etapa 1.
- [ ] `NO-BLOQUEANTE` "Servidor NTP": se asume que el reloj del servidor ya está sincronizado por NTP a nivel
  de infraestructura y que el backend usa un `Clock` del sistema, sin cliente NTP propio.
- [ ] `NO-BLOQUEANTE` El JSON va en `camelCase` (`clientTimestamp`, `driftSeconds`), como el resto de la API
  (PLAN-6, PLAN-8); `snake_case` queda para columnas SQL. El issue los nombra en `snake_case`.
