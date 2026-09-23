# PLAN-22 — Auditar la carga de formulario que llega por sincronización diferida

## Contexto y problema

Existe un agujero de integración entre la auditoría inmutable (PLAN-11) y la sincronización offline (PLAN-14), detectado durante la revisión humana de la integración de ambas ramas.

En PLAN-11 se anotó con `@AuditLog(eventType = "FORM_SUBMITTED", entityType = "VISIT")` el método `VisitFormService.submit()`, que corresponde exclusivamente a la carga de formularios en línea. Sin embargo, la carga diferida implementada en PLAN-14 (`VisitFormService.submitDeferred()`, consumida por cada operación de `POST /api/v1/sync/batch`) no quedó auditada. Como consecuencia, las actas y formularios completados sin conexión que se transmiten luego mediante la sincronización no dejan rastro en `audit.audit_logs`. Considerando que el trabajo de campo ocurre habitualmente en zonas sin cobertura, las actas no auditadas podrían constituir la mayoría del expediente digital.

Para resolverlo, no es viable colocar `@AuditLog` directamente sobre `submitDeferred()` debido a que dicho método maneja también reintentos idempotentes devolviendo `alreadyApplied = true` (`DUPLICATE`). Anotarlo generaría una entrada de auditoría por cada reintento del dispositivo móvil, adulterando el expediente con múltiples registros de carga donde sólo hubo una. La auditoría debe asentarse de manera explícita únicamente cuando la operación de carga se aplica efectivamente en la base de datos, siguiendo el patrón de auditoría programática presente en `PlanningService.assign()`.

## Alcance

**Repos que toca:** `backend`

- **Backend:** Inyección de `AuditChainService` y `AuditRequestContext` en `VisitFormService` (o registro en el flujo de aplicación diferida) para emitir el evento `FORM_SUBMITTED` sobre la visita cuando la operación diferida se aplica de verdad, participando en la misma transacción `REQUIRES_NEW`.

## Criterios de aceptación

1. Una operación de carga de formulario diferida enviada en un lote (`POST /api/v1/sync/batch`) que se aplica efectivamente (`status: APPLIED`) registra exactamente una entrada en `audit.audit_logs` con `event_type = 'FORM_SUBMITTED'`, `entity_type = 'VISIT'`, el `entity_id` igual al ID de la visita, y el usuario autenticado que envió el lote.
2. Un reintento de la misma operación diferida (resultado `DUPLICATE`), sea en el mismo lote o en uno posterior, no genera ninguna entrada adicional en `audit.audit_logs`.
3. Una operación diferida que falla durante la validación o procesamiento del formulario (`FAILED`), o un lote que falla, no deja ninguna entrada en `audit.audit_logs` para esa operación fallida.
4. La cadena de custodia criptográfica (`AuditChainService.verify` / `GET /api/v1/audit/verify`) verifica íntegra y sin roturas (`intacta: true`) después de procesar operaciones de sincronización diferida.

## Fuera de alcance

- Modificaciones a clientes frontend (`frontend` móvil y `backoffice` web): el contrato de la API de sincronización y los endpoints de auditoría permanecen inalterados.
- Reauditar o alterar el comportamiento de la carga en línea (`submit()`).
- Agregar nuevos tipos de eventos de auditoría no contemplados en el modelo existente.

## Preguntas abiertas

Ninguna.
