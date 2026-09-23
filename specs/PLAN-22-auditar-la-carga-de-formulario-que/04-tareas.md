# Tareas — PLAN-22

## backend

- [x] `[backend]` Inyectar `AuditChainService` y `AuditRequestContext` en `VisitFormService`
- [x] `[backend]` Registrar evento `FORM_SUBMITTED` programáticamente en `VisitFormService` al confirmar la aplicación de un formulario diferido
- [x] `[backend]` Agregar casos de prueba de auditoría e integridad en `SyncBatchIntegrationTest.java`

## Verificación

- [x] Gates en verde en los repos del alcance (`node .agents/scripts/verificar.mjs`)
- [x] Revisión independiente sin hallazgos `critical` ni `high`
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto
