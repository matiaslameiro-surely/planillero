# PLAN-14 — Tareas

En orden de dependencia. El backend va completo antes de tocar los clientes: emite
`03-contrato-api.md`, que es la entrada obligatoria de los dos.

## Backend

- [ ] `[backend]` Migración `V12__sync_idempotency.sql`: esquema `sync`, tabla
      `sync.idempotency_keys`, y en `visits.visits` las columnas `sync_operation_id` (con `UNIQUE`),
      `synced_deferred` y `synced_at`.
- [ ] `[backend]` Entidad `IdempotencyKey`, su repositorio y el enum de estado.
- [ ] `[backend]` `IdempotencyService`: reserva por `insert` en transacción propia, lectura de la
      respuesta guardada y cierre de la clave. Hash SHA-256 del cuerpo.
- [ ] `[backend]` DTOs del lote y validación del header `Idempotency-Key` como UUIDv4.
- [ ] `[backend]` `SyncService`: procesa cada operación en su propia transacción, delegando en
      `VisitFormService`; arma el resultado por operación.
- [ ] `[backend]` `VisitFormRecord` y `VisitFormService`: grabar `sync_operation_id`, `synced_deferred`
      y `synced_at`; resolver como `DUPLICATE` la operación ya aplicada.
- [ ] `[backend]` `SyncController` con `@PreAuthorize` y el header.
- [ ] `[backend]` `VisitDto`, `PlanningService` y `Visit`: exponer `syncedDeferred` y `syncedAt` en
      `GET /api/v1/visits`.
- [ ] `[backend]` `SyncBatchIntegrationTest`: camino feliz, reenvío idéntico, reenvío con otro cuerpo,
      header ausente e inválido, operación inválida que no aborta el lote.
- [ ] `[backend]` `SyncConcurrencyIntegrationTest`: 20 hilos con la misma clave, un solo formulario.
- [ ] `[backend]` Escribir `03-contrato-api.md`.

## Frontend (móvil)

- [ ] `[frontend]` `agendaSchema.ts`: paso `version < 3` con la tabla `sync_queue`.
- [ ] `[frontend]` `syncQueue.ts` + tests: encolar, contar, listar pendientes, marcar resultado,
      asignar y conservar el `batch_key`.
- [ ] `[frontend]` `api/sync.ts`: `postSyncBatch` con el header `Idempotency-Key`.
- [ ] `[frontend]` `syncWorker.ts` + tests: despacho, corte de red que deja todo pendiente, reintento
      con la misma clave, rechazo definitivo que marca `failed`.
- [ ] `[frontend]` `useSyncQueue.ts`: cuenta de pendientes y despacho en el flanco offline → online.
- [ ] `[frontend]` `SyncQueueBanner.tsx` + test: «Cola de sincronización: N actas pendientes» y
      confirmación al vaciarse.
- [ ] `[frontend]` `agenda.tsx`: montar el banner y la advertencia con confirmación antes del logout.

## Backoffice

- [ ] `[backoffice]` `planificacion.model.ts`: `Visit` suma `syncedDeferred` y `syncedAt`.
- [ ] `[backoffice]` `planificacion.html` y `.scss`: columna «Sincronización» con la marca «Diferida»
      y la fecha en el título accesible.
- [ ] `[backoffice]` `planificacion.spec.ts`: una visita diferida y una que no.

## Cierre

- [ ] Gates: `node .agents/scripts/verificar.mjs --tarea PLAN-14`.
- [ ] Revisión independiente por repo.
- [ ] Checkpoint de cierre con el usuario, push y PRs.
