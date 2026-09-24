# PLAN-50 — Bug: el heartbeat responde 500 si networkStatus no es ONLINE, OFFLINE o UNKNOWN

## Contexto y problema

`POST /api/v1/supervision/heartbeat` recibe `networkStatus` como texto libre: en `HeartbeatRequest` es un
`String` sin ninguna validación. La columna `visits.operator_shifts.network_status` tiene un
`CHECK (network_status in ('ONLINE', 'OFFLINE', 'UNKNOWN'))` (`V13__supervision_and_shifts.sql`). Un valor
fuera de esa lista (`"WIFI"`, `"online"`, `""`) llega hasta la base, que lo rechaza con una
`DataIntegrityViolationException`, y el backend responde **500**.

La app móvil hoy manda sólo `ONLINE` u `OFFLINE` (`frontend/src/status/useHeartbeat.ts`) y el backoffice no
llama a este endpoint, así que ningún cliente actual está afectado. El problema es doble: es un 500
disparable por cualquier operador autenticado, y la lista de valores válidos la define un `CHECK` de la
base en lugar de la API.

Los valores admitidos ya figuran en el contrato de supervisión (`specs/PLAN-12-…/03-contrato-api.md`),
pero allí no se dice qué pasa con un valor inválido.

## Alcance

**Repos que toca:** `backend`

## Criterios de aceptación

1. `POST /api/v1/supervision/heartbeat` con `"networkStatus": "WIFI"` responde `400` con el formato de
   error habitual (`{"error": "invalid_request", "message": "networkStatus: …"}`), sin llegar a la base:
   el turno del operador no se crea ni se modifica.
2. La comparación distingue mayúsculas: `"online"` y `""` también responden `400`.
3. `ONLINE`, `OFFLINE` y `UNKNOWN` siguen respondiendo `200` y quedan guardados tal cual en el turno.
4. Si `networkStatus` falta o es `null`, la respuesta sigue siendo `200` y el comportamiento es el de
   hoy: no se toca el `networkStatus` que ya tenía el turno. Si el turno se crea con ese mismo latido,
   queda con el valor por defecto de la entidad.
5. Un test de integración cubre el valor inválido (criterio 1), y otro cubre los tres valores válidos y
   el caso ausente (criterios 3 y 4).
6. `03-contrato-api.md` de esta tarea documenta los valores admitidos de `networkStatus` y el `400` por
   valor inválido.

## Fuera de alcance

- Cambiar qué se guarda cuando `networkStatus` falta (ver la pregunta 1).
- Convertir `networkStatus` en un enum Java en la entidad o en `OperatorStatusDto` (la respuesta del
  tablero): los consumidores lo leen como `string` y no cambia.
- Validar el resto de los campos del heartbeat (`latitude`, `longitude`, largo de `observations`).
- Corregir el cuerpo de error que documenta el contrato de PLAN-12 (`{"code": …}`, cuando el backend
  real responde `{"error": …}`): se anota, pero no se reescribe un artefacto de otra tarea.
- Cambios en `frontend` o `backoffice`.

## Preguntas abiertas

- [x] `NO-BLOQUEANTE` — El issue dice que un `networkStatus` ausente «sigue guardándose como `UNKNOWN`».
  El código actual no hace eso: si falta, `SupervisionService.recordHeartbeat` no llama a
  `setNetworkStatus` y el turno conserva lo que tenía, que en un turno nuevo es `ONLINE` (valor inicial
  de `OperatorShift`). Como el criterio del issue dice «sigue», se toma como «no cambiar el
  comportamiento actual» y la spec lo mantiene (criterio 4). Si lo que se quería es guardar `UNKNOWN`
  cuando falta el campo, es un cambio de comportamiento aparte y se decide en el checkpoint del plan.

  **Resuelta en el checkpoint del plan (2026-09-24):** se mantiene el comportamiento actual. Un campo
  ausente no toca el valor del turno, igual que `batteryLevel`, `latitude` y `longitude`.
