# Plan técnico — PLAN-22

## Enfoque

Resolver la omisión de auditoría en la sincronización diferida (`POST /api/v1/sync/batch`) auditando programáticamente cada formulario aplicado en `VisitFormService`.

En lugar de utilizar la anotación `@AuditLog` en `submitDeferred()` —lo cual generaría entradas espurias en `audit.audit_logs` ante reintentos idempotentes que devuelven `alreadyApplied = true`—, se inyectan `AuditChainService` y `AuditRequestContext` en `VisitFormService`. Cuando una carga diferida se valida y persiste con éxito (`alreadyApplied == false`), se invoca `auditChainService.append()` dentro de la misma transacción `REQUIRES_NEW`, registrando el evento `FORM_SUBMITTED` para la visita correspondiente. Si la operación falla o es un reintento duplicado, no se emite ninguna fila de auditoría.

## Archivos a tocar

### backend/

| Archivo | Acción | Para qué |
|---|---|---|
| `backend/src/main/java/ar/com/planillero/visits/VisitFormService.java` | Modificar | Inyectar `AuditChainService` y `AuditRequestContext`, y llamar a `auditChainService.append("FORM_SUBMITTED", ...)` al aplicar un formulario diferido. |
| `backend/src/test/java/ar/com/planillero/sync/SyncBatchIntegrationTest.java` | Modificar | Agregar verificaciones de auditoría para operaciones aplicadas, no duplicadas en reintentos, omitidas en fallos e integridad de la cadena criptográfica. |

## Decisiones técnicas

- **Auditoría programática en `VisitFormService` en lugar de `@AuditLog` en `submitDeferred()`** — Se descartó anotar `submitDeferred()` con `@AuditLog` porque dicho método también atiende operaciones ya aplicadas (`alreadyApplied = true` / `DUPLICATE`). El aspecto AOP no puede discernir si la mutación fue efectiva o un reintento no-op, generando filas duplicadas en la auditoría del expediente ante cada reenvío. Se optó por llamar programáticamente a `auditChainService.append()` exactamente en el punto donde se confirma la escritura del formulario.
- **Participación en la transacción `REQUIRES_NEW`** — El registro de auditoría se ejecuta inmediatamente después de `visitRecordRepository.saveAndFlush(record)` dentro de la transacción propia de la operación diferida. Si ocurre cualquier error antes del commit de la operación, el rollback de la transacción descarta tanto el guardado del formulario como el evento de auditoría, manteniendo estricta atomicidad.
- **Uso de `AuditRequestContext` para metadatos contextuales** — Se descartó modificar la firma de `submitDeferred` para propagar usuario, IP y dispositivo manualmente. Se utiliza `AuditRequestContext` (idéntico a `AuditAspect` y `PlanningService.assign`), permitiendo conservar la firma del servicio y desacoplar los detalles de transporte HTTP.

## Supuestos

Ninguno.

## Cómo se prueba

- Pruebas automáticas en `SyncBatchIntegrationTest.java`:
  1. Operación válida aplicada: comprobar que genera exactamente una fila en `audit.audit_logs` con `event_type = 'FORM_SUBMITTED'`, `entity_type = 'VISIT'`, `username = 'operador.demo'` y `entity_id` igual al ID de la visita.
  2. Operación duplicada / reintento: reenviar la misma operación y verificar que la cuenta de filas en `audit.audit_logs` se mantenga en 1.
  3. Operaciones fallidas en un lote: verificar que operaciones con errores de validación de schema o visitas inexistentes no generen entradas en `audit.audit_logs`.
  4. Integridad de la cadena: invocar `AuditChainService.verify` o el endpoint `/api/v1/audit/verify` tras el procesamiento del lote y validar que `intacta` sea `true`.
- Ejecución de la suite completa con `mvnw -B test` (o `node .agents/scripts/verificar.mjs --tarea PLAN-22`).
