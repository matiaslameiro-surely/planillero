# PLAN-49 — Seguridad: los endpoints por visita no controlan jurisdicción ni asignación

## Contexto y problema

Planificación (`/operators`, `/visits`, `/visits/assign`) e inicio de visita (`/visits/{id}/start`)
recortan el acceso por jurisdicción o por asignación en el service (`PlanningService`,
`VisitStartService`). El resto de los endpoints que reciben un identificador de visita **sólo
controlan el rol** con `@PreAuthorize`: cualquier usuario autenticado con un rol habilitado lee o
escribe evidencias, formularios y manifiestos de visitas de otra zona o que no le asignaron. El issue
lo reproduce con el seed (`operador.demo` y `supervisor.demo` de `ZONA_NORTE` contra `V-2001` de
`ZONA_SUR`, y contra `V-1003`, del norte y sin asignar).

Es un control de acceso horizontal roto (OWASP A01) sobre actas y evidencias que forman parte de un
expediente pericial. Ninguna spec anterior (PLAN-7, PLAN-10, PLAN-13, PLAN-14) lo pedía, así que no
se rompe ningún contrato vigente: se agrega una respuesta `403` que antes no existía.

El issue trae la regla propuesta, los casos observados y los criterios de aceptación. Esta spec fija
la regla para cada endpoint.

## Alcance

**Repos que toca:** `backend`

Los clientes no cambian. En la carga en línea, la app móvil convierte cualquier respuesta de error en
un `ApiError` con el mensaje del backend. En el sync, marca como rechazada la operación que vuelve
`FAILED` (`syncWorker.ts`) y deja las demás aplicadas. En el uso normal, ninguno de los dos clientes
pide una visita ajena: el operador sólo ve su agenda y el supervisor, sólo su zona.

## Regla de acceso

Rige para todos los endpoints de la tabla de abajo. Los roles habilitados siguen siendo los del
`@PreAuthorize` actual. La regla se agrega encima y no los cambia.

| Rol del usuario | Puede operar sobre la visita si… | Si no, responde |
|---|---|---|
| `ADMINISTRATOR` | siempre | — |
| `SUPERVISOR` | la visita es de su jurisdicción (`visit.jurisdiction == user.jurisdiction`) | `403 outside_jurisdiction` |
| `OPERATOR` | tiene la visita en alguna hoja de ruta propia (misma regla que `VisitStartService`) | `403 visit_not_assigned` |

- Con más de un rol, vale el más amplio (administrador, después supervisor y por último operador).
- Si la visita no existe, se responde `404 visit_not_found` **antes** de evaluar el acceso, igual
  que el inicio de visita.
- Los códigos y mensajes son los que ya usa planificación: `outside_jurisdiction` («No tenés
  jurisdicción sobre las visitas u operadores de esa zona.») y `visit_not_assigned` («La visita no
  está asignada a este operador.»).

Endpoints alcanzados:

| Método | Ruta | Roles (sin cambios) |
|---|---|---|
| `POST` | `/api/v1/visits/{visitId}/evidences` | operador, supervisor, admin |
| `GET` | `/api/v1/visits/{visitId}/evidences` | operador, supervisor, admin |
| `GET` | `/api/v1/visits/{visitId}/evidences/{evidenceId}/file` | operador, supervisor, admin |
| `POST` | `/api/v1/visits/{visitId}/manifest` | operador, supervisor, admin |
| `GET` | `/api/v1/visits/{visitId}/manifest` | operador, supervisor, admin |
| `POST` | `/api/v1/visits/{visitId}/manifest/verify` | operador, supervisor, admin |
| `POST` | `/api/v1/visitas/{id}/formulario` | operador, supervisor, admin |
| `GET` | `/api/v1/visitas/{id}/formulario` | supervisor, admin |
| `POST` | `/api/v1/sync/batch`, operación `VISIT_FORM` | operador, supervisor, admin |

## Criterios de aceptación

1. Cada caso observado en el issue responde `403` con el código de la regla:
   - `operador.demo` sobre `V-2001` (zona sur) en `POST` y `GET .../evidences` y en `POST .../formulario` → `403 visit_not_assigned`.
   - `operador.demo` sobre `V-1003` (zona norte, no asignada) en `POST .../formulario` → `403 visit_not_assigned`.
   - `supervisor.demo` sobre `V-2001` en `GET .../evidences` y en `GET .../formulario` → `403 outside_jurisdiction`.
2. Los endpoints «con la misma forma» del issue también aplican la regla: `GET .../evidences/{evidenceId}/file`,
   `POST` y `GET .../manifest` y `POST .../manifest/verify` responden `403 visit_not_assigned` para un operador sin la
   visita asignada y `403 outside_jurisdiction` para un supervisor de otra zona.
3. En `POST /api/v1/sync/batch`, una operación `VISIT_FORM` sobre una visita sin acceso vuelve con `status: FAILED` y
   `error` igual a `visit_not_assigned` o `outside_jurisdiction`. El lote responde `200` y las demás operaciones del
   mismo envío se aplican normalmente.
4. Una escritura rechazada por la regla no deja rastro: ni fila en `evidences`, ni binario en el storage, ni formulario
   guardado en la visita, ni manifiesto sellado.
5. Los casos legítimos responden igual que hoy: el operador sobre una visita que tiene en su hoja de ruta, el
   supervisor sobre una visita de su zona y el administrador sobre una visita de cualquier zona.
6. Con un identificador de visita que no existe, todos los endpoints de la tabla responden `404 visit_not_found`
   (en el sync, `FAILED` con ese código, como hoy).
7. Hay tests de integración que cubren, para cada endpoint de la tabla, el acceso cruzado entre zonas, la visita no
   asignada (en los endpoints que admiten al operador) y al menos un caso legítimo por rol.
8. `03-contrato-api.md` de esta tarea documenta la regla y los `403` nuevos. Los contratos anteriores que describen
   estos endpoints (PLAN-7, PLAN-10, PLAN-13 y PLAN-14) suman una nota que remite a él.
9. Los gates del backend (`compilar`, `tests`) pasan.

## Fuera de alcance

- Los `404` de evidencia o manifiesto inexistente (`evidence_not_found`, `manifest_not_found`) y los `400` que hoy
  salen de `IllegalArgumentException`. Los resuelve PLAN-51 (PR #16 del backend, abierto).
- Auditar los intentos de acceso rechazados.
- Cambiar los roles de `@PreAuthorize` de cualquier endpoint.
- Ocultar la existencia de la visita (responder `404` en lugar de `403`).
- La resolución del firmante en `EvidenceController.resolveUserId` (el fallback a un UUID derivado del nombre).
- Cambios en `frontend` o `backoffice`.
- Revisar el control de acceso de los endpoints que no reciben un identificador de visita.

## Preguntas abiertas

- [x] `NO-BLOQUEANTE` — **¿El administrador pasa por rol o por jurisdicción `GLOBAL`?** El issue habla de
  «Administrador (`GLOBAL`)». Se decide **por rol**: el `@PreAuthorize` ya razona por rol, y el seed le da
  `GLOBAL` al único administrador, así que el resultado hoy es el mismo. `SupervisionService` usa el string
  `GLOBAL`, pero ahí la jurisdicción filtra una consulta, no autoriza una operación.
- [x] `NO-BLOQUEANTE` — **¿«Asignada» es «en una hoja de ruta de hoy» o «en alguna hoja de ruta»?** Se toma
  «alguna», como `VisitStartService` (`existsByOperatorIdAndVisitId`). Un operador que inició una visita tiene
  que poder cargarle el formulario y la evidencia aunque la jornada termine y sincronice al día siguiente.
- [x] `NO-BLOQUEANTE` — **¿`404` antes que `403`?** Sí, como el inicio de visita. Revela si un UUID existe, pero
  los identificadores son UUID v4 y no se pueden enumerar. Ocultarlo queda fuera de alcance.
- [x] `NO-BLOQUEANTE` — **En el sync, ¿el control va antes que la detección de operación repetida?** Sí: una
  operación sin acceso se rechaza aunque su `clientOperationId` ya exista. En la práctica no cambia el reintento
  legítimo: una visita iniciada no se puede reasignar y la hoja de ruta de otro día no se borra, así que quien
  la aplicó sigue teniendo acceso.
- [x] `NO-BLOQUEANTE` — **Colisión con PLAN-51.** El PR #16 toca `EvidenceService`, `ManifestService` y
  `EvidenceIntegrationTest`, los mismos archivos que esta tarea. Quien mergee segundo resuelve el conflicto.
  El comportamiento no se contradice: los dos responden `404 visit_not_found` para una visita inexistente.
