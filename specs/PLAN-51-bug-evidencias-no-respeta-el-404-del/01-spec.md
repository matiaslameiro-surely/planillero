# PLAN-51 — Bug: evidencias no respeta el 404 del contrato y acepta evidencia para visitas que no existen

## Contexto y problema

El contrato de API de PLAN-10 (`specs/PLAN-10-task-08-registro-de-evidencias/03-contrato-api.md`) especifica que cuando un recurso no existe (visita, evidencia o manifiesto), los endpoints deben responder con código HTTP `404 Not Found` y un código de error específico (`visit_not_found`, `evidence_not_found`, `manifest_not_found`).

Actualmente, el backend presenta las siguientes discrepancias:
1. `POST /api/v1/visits/{visitId}/evidences` no valida la existencia previa de la visita en la base de datos (`VisitRepository`). Por lo tanto, al enviar un `visitId` inexistente, se persiste el archivo en el storage WORM y se inserta el registro en la tabla `evidences`, respondiendo `201 Created`. Dado que el storage WORM es inmutable, ese archivo huérfano no puede sobreescribirse ni limpiarse fácilmente.
2. `GET /api/v1/visits/{visitId}/evidences/{evidenceId}/file` arroja `IllegalArgumentException` cuando no encuentra la evidencia, la cual es capturada por `ApiExceptionHandler` y devuelta como `400 Bad Request` en lugar de `404 Not Found`.
3. `GET /api/v1/visits/{visitId}/manifest` arroja `IllegalArgumentException` si la visita no tiene manifiesto registrado, respondiendo `400 Bad Request` en lugar de `404 Not Found`.
4. `POST /api/v1/visits/{visitId}/manifest/verify` arroja `IllegalArgumentException` si la visita no tiene manifiesto registrado, respondiendo `400 Bad Request` en lugar de `404 Not Found`.

## Alcance

**Repos que toca:** `backend`

## Criterios de aceptación

1. `POST /api/v1/visits/{visitId}/evidences` con un `visitId` que no existe en la base de datos devuelve HTTP `404 Not Found` con cuerpo `{"error": "visit_not_found", "message": "No existe la visita indicada."}`, y no almacena ningún binario en el storage ni crea registros en la base de datos.
2. `GET /api/v1/visits/{visitId}/evidences` con un `visitId` inexistente devuelve HTTP `404 Not Found` con código `visit_not_found`.
3. `GET /api/v1/visits/{visitId}/evidences/{evidenceId}/file` cuando la visita no existe devuelve `404 Not Found` (`visit_not_found`), y cuando la evidencia no existe (o no pertenece a la visita) devuelve HTTP `404 Not Found` con código `evidence_not_found`.
4. `POST /api/v1/visits/{visitId}/manifest` cuando la visita no existe devuelve `404 Not Found` (`visit_not_found`), y cuando alguna de las evidencias especificadas en `evidenceIds` no existe devuelve `404 Not Found` (`evidence_not_found`).
5. `GET /api/v1/visits/{visitId}/manifest` para una visita inexistente devuelve `404 Not Found` (`visit_not_found`), y para una visita sin manifiesto registrado devuelve HTTP `404 Not Found` con código `manifest_not_found`.
6. `POST /api/v1/visits/{visitId}/manifest/verify` para una visita inexistente devuelve `404 Not Found` (`visit_not_found`), y para una visita sin manifiesto registrado devuelve HTTP `404 Not Found` con código `manifest_not_found`.
7. Las validaciones de negocio previas (archivo vacío o ausente, discrepancia de hash `integrity_mismatch`, lista de evidencias vacía al sellar manifiesto) se mantienen respondiendo HTTP `400 Bad Request`.
8. Se implementan tests de integración y unitarios que cubren cada uno de los escenarios de error 404 y verifican que no queden archivos huérfanos en storage.
9. Todos los gates de verificación del backend pasan exitosamente.

## Fuera de alcance

- Control de acceso horizontal por jurisdicción o asignación de visita para evidencias (cubierto por la tarea hermana PLAN-49).
- Modificaciones en frontend o backoffice (los clientes ya están preparados para consumir el contrato de errores de PLAN-10).

## Preguntas abiertas

Ninguna
