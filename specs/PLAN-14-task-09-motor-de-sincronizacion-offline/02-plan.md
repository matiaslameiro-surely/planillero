# PLAN-14 — Plan técnico

## Enfoque

La garantía de no duplicación se resuelve **en la base**, no en la capa de servicio: dos restricciones
`UNIQUE` y un `insert` que falla son lo único que sigue siendo cierto con 20 hilos simultáneos, un
reinicio a mitad de camino o dos instancias del backend.

Son dos niveles de idempotencia, porque protegen de cosas distintas:

- **Por lote** (`Idempotency-Key` en el header). Un reintento del mismo envío devuelve la respuesta
  guardada sin volver a procesar. Protege del reintento del cliente cuando la respuesta se perdió.
- **Por operación** (`clientOperationId` dentro de cada ítem). Protege del caso en que el lote se
  recorta o se reorganiza: la misma acción, aunque venga en otro lote y con otra clave, se escribe
  una sola vez porque `visits.visits.sync_operation_id` es `UNIQUE`.

El endpoint no reimplementa la carga del formulario: delega en `VisitFormService`, que ya valida
contra el JSON Schema de la plantilla (PLAN-7). El lote es transporte, no reglas de negocio nuevas.

Del lado del móvil, la cola es **una tabla más de la base cifrada que ya existe** (PLAN-9): no hay
almacenamiento nuevo ni claves nuevas. El worker no es un servicio en segundo plano del sistema
operativo: es un efecto que reacciona al flanco «sin red → con red» de `useDeviceStatus`, que ya está
escrito y probado. Esa es la diferencia entre una tarea de días y una de semanas, y cubre el caso
real (la app abierta en la tablet del operador).

El backoffice sólo consume un campo nuevo del endpoint de visitas y agrega una columna.

## Archivos a crear o modificar

### backend

**Crear — `src/main/java/ar/com/planillero/sync/`**

| Archivo | Qué es |
|---|---|
| `SyncController.java` | `POST /api/v1/sync/batch`; lee el header `Idempotency-Key`, `@PreAuthorize` por rol |
| `SyncService.java` | Orquesta el lote: reserva la clave, procesa operación por operación, guarda la respuesta |
| `IdempotencyService.java` | Reserva/lee/completa la clave en transacción propia (`REQUIRES_NEW`) |
| `IdempotencyKey.java` | Entidad de `sync.idempotency_keys` |
| `IdempotencyKeyRepository.java` | Repositorio JPA |
| `IdempotencyKeyStatus.java` | `IN_PROGRESS`, `COMPLETED` |
| `SyncOperationType.java` | `VISIT_FORM`. Enum de un solo valor **a propósito**: el contrato ya nace extensible |
| `dto/SyncBatchRequest.java` | `List<SyncOperationRequest> operations`, validado no vacío y con tope |
| `dto/SyncOperationRequest.java` | `clientOperationId`, `type`, `visitId`, `form` (el `FormSubmissionRequest` que ya existe) |
| `dto/SyncBatchResponse.java` | `List<SyncOperationResult> results` |
| `dto/SyncOperationResult.java` | `clientOperationId`, `status` (`APPLIED`/`DUPLICATE`/`FAILED`), `error`, `message` |

**Crear — migración**

| Archivo | Qué hace |
|---|---|
| `src/main/resources/db/migration/V12__sync_idempotency.sql` | `schema sync`; tabla `sync.idempotency_keys`; en `visits.visits`: `sync_operation_id uuid UNIQUE`, `synced_deferred boolean not null default false`, `synced_at timestamptz` |

**Crear — tests**

| Archivo | Qué prueba |
|---|---|
| `src/test/java/ar/com/planillero/sync/SyncBatchIntegrationTest.java` | Camino feliz, reenvío idéntico, reenvío con otro cuerpo, header ausente/inválido, operación inválida que no aborta el lote |
| `src/test/java/ar/com/planillero/sync/SyncConcurrencyIntegrationTest.java` | 20 hilos con la misma clave: un solo formulario guardado |

**Modificar**

| Archivo | Cambio |
|---|---|
| `visits/VisitFormRecord.java` | Columnas `sync_operation_id`, `synced_deferred`, `synced_at`; método para marcar el envío diferido |
| `visits/VisitFormService.java` | Sobrecarga que acepta el `clientOperationId` y la marca de diferido |
| `planning/dto/VisitDto.java` | Suma `syncedDeferred` y `syncedAt` |
| `planning/PlanningService.java` | `toVisitDto` completa los dos campos nuevos |
| `planning/Visit.java` | Lectura de las dos columnas nuevas (no las escribe) |

### frontend (móvil)

| Archivo | Qué es |
|---|---|
| `src/db/agendaSchema.ts` | **Modificar**: paso `version < 3` que crea `sync_queue`. Mismo mecanismo de `PRAGMA user_version` |
| `src/sync/syncQueue.ts` | **Crear**: encolar, contar pendientes, listar pendientes, marcar resultado |
| `src/sync/syncQueue.test.ts` | **Crear** |
| `src/api/sync.ts` | **Crear**: `postSyncBatch(idempotencyKey, operations)` |
| `src/sync/syncWorker.ts` | **Crear**: arma el lote, despacha, aplica resultados, reintentos con espera creciente |
| `src/sync/syncWorker.test.ts` | **Crear**: corte de red, reintento sin duplicar, rechazo definitivo |
| `src/sync/useSyncQueue.ts` | **Crear**: hook con la cuenta de pendientes y el despacho al volver la red |
| `src/components/SyncQueueBanner.tsx` | **Crear**: «Cola de sincronización: N actas pendientes» y confirmación al vaciarse |
| `src/components/SyncQueueBanner.test.tsx` | **Crear** |
| `src/app/agenda.tsx` | **Modificar**: monta el banner y la advertencia antes de cerrar sesión |

### backoffice

| Archivo | Cambio |
|---|---|
| `src/app/core/models/planificacion.model.ts` | `Visit` suma `syncedDeferred: boolean` y `syncedAt: string \| null` |
| `src/app/pages/planificacion/planificacion.html` | Columna «Sincronización» con la marca «Diferida» |
| `src/app/pages/planificacion/planificacion.scss` | Estilo de la marca |
| `src/app/pages/planificacion/planificacion.spec.ts` | Caso: una visita diferida y una que no |

## Decisiones técnicas

**1. La clave de idempotencia se reserva con un `insert`, no con un `select` previo.**
El service inserta la fila en `IN_PROGRESS` en una transacción propia (`REQUIRES_NEW`) y deja que la
restricción de clave primaria decida quién gana. Si el `insert` viola la unicidad, se lee la fila
existente: `COMPLETED` → se devuelve la respuesta guardada; `IN_PROGRESS` → `409
idempotency_key_in_progress`.
*Alternativa descartada:* `select` y después `insert`. Es la implementación intuitiva y es incorrecta:
entre las dos sentencias entran los otros 19 hilos. Ninguna cantidad de sincronización en Java lo
arregla, porque mañana hay dos instancias del backend.

**2. Cada operación del lote corre en su propia transacción (`REQUIRES_NEW`).**
Un formulario que no cumple el schema tiene que fallar solo, sin arrastrar a los otros 19 del lote.
*Alternativa descartada:* una transacción para todo el lote. Es más simple, pero convierte un error de
dato de una visita en la pérdida del trabajo de toda una jornada, que es justo lo que esta tarea
viene a evitar.

**3. El cuerpo se identifica por un hash SHA-256, no se guarda para comparar.**
Se guarda la huella del pedido junto a la clave. Si llega la misma clave con otra huella, es un error
del cliente (reusó una clave) y se responde `409`.
*Alternativa descartada:* comparar el JSON crudo. Obliga a guardar el pedido completo, que contiene
datos del expediente, duplicados y sin motivo.

**4. La marca de «diferida» es el origen del dato, no el reloj.**
`synced_deferred` se pone en `true` sólo cuando el formulario entró por `POST /api/v1/sync/batch`.
*Alternativa descartada:* deducirla del desfasaje entre `started_at_device` y `started_at_server`. Un
reloj mal configurado se vería como trabajo offline, y el `drift_seconds` ya existe para otra cosa.

**5. El worker del móvil es un efecto de React, no una tarea en segundo plano del sistema.**
Se dispara con el flanco «sin red → con red» de `useDeviceStatus`, ya escrito y probado, y al montar
la agenda.
*Alternativa descartada:* `expo-background-task`. Despacharía con la app cerrada, pero suma un permiso,
configuración por plataforma y una ruta de ejecución que no se puede probar con Jest. El caso real es
la tablet abierta en la mano del operador; queda anotado como mejora posterior.

**6. La clave de lote se persiste en la cola antes de enviar.**
Al despachar, las filas pendientes reciben un `batch_key` (UUIDv4) que se guarda **antes** de la
petición. Si el envío falla por red, el reintento usa la misma clave y el backend lo reconoce como el
mismo envío.
*Alternativa descartada:* generar la clave en cada intento. Cada reintento sería un envío nuevo para el
backend, y la protección de lote no serviría para nada — que es exactamente el bug que la tarea
previene.

**7. La cola vive en el archivo SQLite existente, con `PRAGMA user_version` como está.**
*Alternativa descartada:* una segunda base para sincronización. Serían dos claves, dos archivos y dos
ciclos de vida, sin ganar nada: `user_version` es del archivo y ya sirve para versionar varias tablas.

## Contrato de API a alto nivel

El detalle definitivo lo emite el backend en `03-contrato-api.md` durante la fase 3.

```
POST /api/v1/sync/batch
Headers: Authorization: Bearer <jwt>, Idempotency-Key: <uuid v4>
Body:    { "operations": [ { "clientOperationId": "<uuid v4>",
                             "type": "VISIT_FORM",
                             "visitId": "<uuid>",
                             "form": { "templateKey": "...", "templateVersion": 1,
                                       "responses": { ... } } } ] }
200:     { "results": [ { "clientOperationId": "...", "status": "APPLIED|DUPLICATE|FAILED",
                          "error": null, "message": null } ] }
400:     idempotency_key_required | idempotency_key_invalid | invalid_request
409:     idempotency_key_reused | idempotency_key_in_progress
```

`GET /api/v1/visits` suma por visita: `syncedDeferred: boolean`, `syncedAt: string | null`.

## Supuestos

> **Se cumplió** (2026-09-21, durante la revisión humana). PLAN-11 se mergeó primero y se quedó con
> la `V11` y con el paso 2 del esquema local del móvil. La migración pasó a `V12` y la cola al paso
> 3. Se deja el supuesto tal como se escribió, con la corrección al lado: sirve para ver qué se
> anticipó y qué pasó de verdad.

- `RIESGO` — **La próxima migración libre es `V11`.** PLAN-12 y PLAN-13 están en el mismo sprint y
  recién se toman; si alguna sube una `V11` antes que esta tarea, Flyway falla al arrancar. Flyway
  acepta huecos de numeración, así que se resuelve renumerando; si al llegar a la fase 3 ya existe una
  `V11` ajena, esta migración pasa al número libre siguiente.
- `RIESGO` — **La pantalla que encola no existe todavía**: la carga del formulario en el móvil es
  PLAN-13 (TASK-07 móvil), en curso por otra persona. Esta tarea entrega la cola y su API pública
  (`enqueue`) más el ciclo completo verificado con tests; la integración con la pantalla real queda
  para quien cierre PLAN-13. Si se esperara a esa pantalla, esta tarea quedaría bloqueada por otra.
- El `clientOperationId` lo genera el móvil con `expo-crypto`, que ya es dependencia.
- `visits.visits` es la tabla de las «actas» del issue: no existe una entidad `acta` separada, y el
  formulario de la visita es el documento que el issue llama así.
- El tope de operaciones por lote (100) y de reintentos por operación (5, con espera creciente) son
  valores de arranque, no un requisito del issue.
- Los tests de concurrencia corren sobre PostgreSQL real vía Testcontainers, como el resto de los
  tests de integración del repo. Un test de concurrencia contra H2 no probaría nada.

## Checkpoint

Se presenta al usuario: hay dos supuestos marcados `RIESGO` y el plan supera los 12 archivos
(`limiteArchivosSinCheckpoint`), además de que `plan` ya figura en `flujo.checkpoints`.
