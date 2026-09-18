# PLAN-8 — TASK-04 (Web): Módulo de Asignación y Planificación de Rutas en Angular

## Contexto y problema

El proyecto ya tiene la capa de autenticación y RBAC (PLAN-6): el backend sabe quién es cada usuario y
qué rol tiene (`OPERATOR`, `SUPERVISOR`, `ADMINISTRATOR`), pero **ningún módulo de negocio existe
todavía**. No hay operadores, ni visitas, ni hojas de ruta: las tres son parte del dominio de la
planificación de recorridos que esta tarea empieza a construir.

El problema concreto: el **supervisor** no tiene ninguna forma de armar el recorrido diario de cada
operador. Hoy tendría que hacerlo a mano y por un canal externo, sin registrar qué visita se asignó a
quién ni en qué orden, y sin que eso quede en el sistema para que el operador lo vea en el móvil.

Esta tarea (la porción **Web** de la TASK-04) entrega el módulo de planificación: un backend que define
el contrato de visitas, hojas de ruta y asignación, y una pantalla web en Angular donde el supervisor
selecciona fecha, filtra visitas por múltiples criterios, las asigna a operadores con acciones rápidas
y ve en un mapa la distribución resultante.

El issue declara alcance fullstack. Por decisión del equipo (confirmada), **PLAN-8 cubre backend y
backoffice**; la porción móvil de la misma TASK-04 es PLAN-9 y consume el mismo contrato.

## Alcance

**Repos que toca:** `backend`, `backoffice` (web)

## Criterios de aceptación

1. La migración `V4` (esquema `visits`, tablas y columnas en inglés) crea `visits.visits` y
   `visits.route_sheets` con sus índices, agrega `core.users.jurisdiction` y siembra datos **ficticios**
   de desarrollo: usuarios con rol `OPERATOR` y `SUPERVISOR` con jurisdicción, visitas y una hoja de
   ruta. El arranque del backend contra una base limpia aplica la migración sin error y `ddl-auto`
   (validate) no denuncia discrepancias.
2. `GET /api/v1/operators` devuelve los operadores (id, nombre de usuario, jurisdicción), con 401 si
   no hay token y 403 si el rol es insuficiente.
3. `GET /api/v1/operators/{operatorId}/route-sheets?date=YYYY-MM-DD` devuelve la hoja de ruta del
   operador para esa fecha con sus visitas **ordenadas por urgencia de mayor a menor**; devuelve 404
   si el operador no existe y una lista vacía si no tiene asignaciones para esa fecha.
4. `GET /api/v1/visits?status=&urgency=&jurisdiction=&operatorId=&date=` devuelve las visitas que
   cumplen los filtros (todos opcionales y combinables), con los valores de estado y urgencia que
   define el contrato, y recorta al alcance de la jurisdicción del usuario autenticado.
5. `POST /api/v1/visits/assign` asigna un conjunto de visitas a un operador para una fecha: realiza
   la asignación, ordena cada hoja de ruta por urgencia y responde el detalle resultante. Si una
   visita ya estaba asignada esa fecha a un **operador distinto**, se reasigna (se suelta del
   anterior y se suma a la nueva hoja): es la acción de reasignación rápida de la heurística 7.
   Devuelve 400 si una visita ya estaba asignada a **ese mismo operador** para esa fecha, si la
   fecha es inválida o si no se envía ninguna visita; 404 si el operador o alguna visita no existe;
   **403 si la visita, el operador o la jurisdicción del propio supervisor no comparten jurisdicción**
   (OWASP A01: acceso horizontal).
6. Los cuatro endpoints exigen autenticación por defecto y `@PreAuthorize("hasRole('SUPERVISOR')")`:
   sin token → 401, con token de otro rol → 403, con token de `SUPERVISOR` → 200/4xx de negocio.
7. El backoffice tiene una ruta protegida `/planificacion` accesible solo con sesión y rol
   `SUPERVISOR`; sin sesión redirige a `/login` y con rol insuficiente muestra acceso denegado.
8. La pantalla de planificación permite: seleccionar la fecha, filtrar visitas por operador, estado y
   urgencia, ver las visitas en una **grilla reactiva propia** (sin librerías de grilla) con acciones
   de **asignación y reasignación rápida** (heurística 7), y ver en un **mapa Leaflet + OpenStreetMap**
   los marcadores de las visitas de la hoja de ruta seleccionada.
9. Hay tests unitarios del backoffice (service, componente de grilla y filtros, guard por rol) y tests
   de integración REST del backend (Testcontainers) que cubren: orden por urgencia, conflictos de
   asignación (400), 401/403 y **acceso horizontal entre jurisdicciones**.
10. Los gates compilan y prueban todo: Maven (compile + test) en `backend`, y lint + build + test en
    `backoffice`.

## Fuera de alcance

- La porción **móvil** de la TASK-04 (hoja de ruta del operador en la app, GPS): es PLAN-9.
- Motor de validación JSON Schema / columnas JSONB: es PLAN-7.
- Evidencias con hash SHA-256 / MinIO: es PLAN-10.
- CRUD de visitas, operadores y jurisdicciones por UI: los datos de partida vienen del seed de
  desarrollo; la carga real de visitas no forma parte de esta tarea.
- Edición de la jurisdicción de un usuario por API o UI: se fija en el seed para esta tarea.
- Dibujado de recorridos/polilíneas ni cálculo de distancias en el mapa: el mapa muestra marcadores.
- Manejo de "no show"/completado de visitas desde el backoffice: eso es dominio del operador en el
  móvil (PLAN-9) o una tarea posterior.

## Preguntas abiertas

- [x] `BLOQUEANTE` — **Alcance**: la TASK-04 "Alcance Fullstack" se reparte entre PLAN-8 (Web) y
      PLAN-9 (Móvil), y varios issues del sprint tocan el backend. **Resuelta →** PLAN-8 implementa
      **backend + backoffice** (endpoints, tablas y pantalla web); la coordinación de ramas y
      numeración de migraciones se avisa en el plan para minimizar colisiones con PLAN-7/PLAN-9/PLAN-10.
- [x] `BLOQUEANTE` — **Jurisdicción**: el criterio OWASP A01 («el supervisor solo asigna en su
      jurisdicción») exige un concepto que hoy no existe en el modelo. **Resuelta →** se agrega
      `core.users.jurisdiction` en la migración V4; la asignación valida que la jurisdicción del
      supervisor autenticado, la del operador y la de cada visita coincidan.
- [x] `NO-BLOQUEANTE` — **Nombres**: el issue escribe endpoints y tablas en español (`/operadores`,
      `hojas_de_ruta`, `visitas`). **Resuelta →** por convención del proyecto, todo en inglés:
      `/api/v1/operators`, `/api/v1/visits`, tablas `visits`/`route_sheets`. El contrato queda en
      `03-contrato-api.md`.
- [x] `NO-BLOQUEANTE` — **Librerías de UI**: el backoffice no tiene ninguna. **Resuelta →** grilla y
      filtros con componentes Angular propios (sin dependencias de grilla) y **Leaflet + OpenStreetMap**
      solo para el mapa (única dependencia nueva, con su `@types`).