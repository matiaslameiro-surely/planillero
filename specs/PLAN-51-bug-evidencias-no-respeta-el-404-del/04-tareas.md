# Tareas — PLAN-51

Checklist en orden de dependencia para la implementación y verificación del bug fix.

## backend

- [x] `[backend]` Inyectar `VisitRepository` en `EvidenceService` y validar existencia de visita (`visit_not_found`) y de evidencia (`evidence_not_found`) lanzando `ApiException.notFound`.
- [x] `[backend]` Inyectar `VisitRepository` en `ManifestService` y validar existencia de visita (`visit_not_found`), evidencia (`evidence_not_found`) y manifiesto (`manifest_not_found`) con `ApiException.notFound`.
- [x] `[backend]` Actualizar y expandir `EvidenceIntegrationTest` para cubrir todos los escenarios 404 y verificar que no se escriban archivos en storage ante visitas inexistentes.

## Verificación

- [x] Gates en verde en los repos del alcance (`node .agents/scripts/verificar.mjs --tarea PLAN-51`)
- [x] Revisión independiente sin hallazgos `critical` ni `high` (`node .agents/scripts/revisar.mjs --tarea PLAN-51 --repo backend`)
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto
