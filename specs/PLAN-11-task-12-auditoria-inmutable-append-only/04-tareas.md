# Tareas — PLAN-11

## backend

- [ ] `[backend]` Agregar `spring-boot-starter-aop` a `pom.xml`
- [ ] `[backend]` Migración `V11__audit_log_schema.sql`: tabla `auditoria_logs` + trigger que rechaza `UPDATE`/`DELETE`
- [ ] `[backend]` `audit/AuditLog.java` (anotación) y `audit/AuditLogEntry.java` (entidad)
- [ ] `[backend]` `audit/AuditLogRepository.java`
- [ ] `[backend]` `audit/AuditMasker.java` + test
- [ ] `[backend]` `audit/AuditChainService.java` (hash encadenado + lock de última fila)
- [ ] `[backend]` `audit/AuditAspect.java` (usuario, IP, dispositivo, delta)
- [ ] `[backend]` Anotar `PlanningService.assign`, `VisitStartService.start`, `VisitFormService.submit`, `EvidenceService.saveEvidence`, `ManifestService.createAndSignManifest` con `@AuditLog`
- [ ] `[backend]` `audit/AuditController.java`: `GET /audit/logs` y `GET /audit/verify` (`ADMINISTRATOR`)
- [ ] `[backend]` `AuditChainImmutabilityTest`, `AuditAspectTest`, `AuditControllerTest`
- [ ] `[backend]` Emitir `03-contrato-api.md`

## frontend *(app móvil)*

- [ ] `[frontend]` Leer `03-contrato-api.md` antes de empezar
- [ ] `[frontend]` Paso de migración `version < 2` en `agendaSchema.ts`: tabla `visit_audit_traces`
- [ ] `[frontend]` `audit/auditRepository.ts` (`insertTrace`, `listTraces`) + test
- [ ] `[frontend]` Registrar traza local en `visit/startVisit.ts` (inicio de visita)
- [ ] `[frontend]` Registrar traza local en `app/evidence/[visitId].tsx` (evidencia guardada)

## backoffice *(web)*

- [ ] `[backoffice]` Leer `03-contrato-api.md` antes de empezar
- [ ] `[backoffice]` `core/guards/administrator.guard.ts`
- [ ] `[backoffice]` `core/models/audit.model.ts` + `core/services/audit.service.ts` + test
- [ ] `[backoffice]` Página `pages/auditoria/` (tabla filtrable + botón "Auditar Integridad de Visita") + test
- [ ] `[backoffice]` Ruta `/auditoria` en `app.routes.ts` con `administratorGuard`
- [ ] `[backoffice]` Link a "Auditoría" en `home.html`, visible sólo para `ADMINISTRATOR`

## Verificación

- [ ] Gates en verde en los tres repos (`node .agents/scripts/verificar.mjs --tarea PLAN-11`)
- [ ] Revisión independiente sin hallazgos `critical` ni `high`
- [ ] Cada criterio de aceptación de `01-spec.md` (1 a 8) queda cubierto
