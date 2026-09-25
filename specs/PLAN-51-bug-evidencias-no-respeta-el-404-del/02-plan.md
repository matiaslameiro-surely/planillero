# Plan técnico — PLAN-51

## Enfoque

Garantizar el cumplimiento estricto del contrato de API de PLAN-10 ante recursos inexistentes en los endpoints periciales (`/api/v1/visits/{visitId}/evidences` y `/api/v1/visits/{visitId}/manifest`).
Para ello:
1. En `EvidenceService`, inyectar `VisitRepository` y validar que la visita exista antes de interactuar con el storage o la base de datos, lanzando `ApiException.notFound("visit_not_found", ...)`. Al buscar una evidencia puntual, si no existe o no pertenece a la visita, lanzar `ApiException.notFound("evidence_not_found", ...)`.
2. En `ManifestService`, inyectar `VisitRepository` y validar la existencia de la visita en todas sus operaciones (`createAndSignManifest`, `getLatestManifest`, `verifyManifest`). En caso de que no exista la visita, lanzar `ApiException.notFound("visit_not_found", ...)`. Si una evidencia a sellar no existe o no pertenece a la visita, lanzar `ApiException.notFound("evidence_not_found", ...)`. Si no existe un manifiesto previo en consultas o verificación, lanzar `ApiException.notFound("manifest_not_found", ...)`.
3. Actualizar los tests de integración en `EvidenceIntegrationTest` para usar IDs de visitas reales y agregar pruebas exhaustivas para cada condición de 404 (visita inexistente, evidencia inexistente, manifiesto inexistente, y verificación de no-creación de archivos en storage).

## Archivos a tocar

### backend/

| Archivo | Acción | Para qué |
|---|---|---|
| `backend/src/main/java/ar/com/planillero/evidence/service/EvidenceService.java` | Modificar | Validar existencia de visita previa a ingesta/consulta y arrojar 404 con `visit_not_found` y `evidence_not_found` |
| `backend/src/main/java/ar/com/planillero/evidence/service/ManifestService.java` | Modificar | Validar existencia de visita y manifiesto, arrojando 404 con `visit_not_found`, `evidence_not_found` y `manifest_not_found` |
| `backend/src/test/java/ar/com/planillero/evidence/EvidenceIntegrationTest.java` | Modificar | Ajustar pruebas existentes con visitas reales del seed y añadir casos de prueba para cada error 404 y verificación de storage limpio |

## Decisiones técnicas

- **Validación previa en `EvidenceService` antes del guardado en storage** — Se descartó validar la visita luego de calcular el hash o guardar en storage porque el storage WORM es inmutable y escribir un archivo para una visita inexistente genera archivos huérfanos imposibles de borrar o sobreescribir.
- **Uso de `ApiException.notFound` en lugar de `IllegalArgumentException`** — Se descartó mantener `IllegalArgumentException` con un handler específico en `ApiExceptionHandler` porque `ApiException` es el estándar del backend para mapear código HTTP y código de negocio unificado (`error` y `message`), mientras que `IllegalArgumentException` se reserva para parámetros mal formados (400 `bad_request`).

## Supuestos

Ninguno

## Cómo se prueba

1. Ejecución de suite completa de tests de integración de backend:
   `mvnw -B test` (o verificación vía `.agents/scripts/verificar.mjs`).
2. Test específico en `EvidenceIntegrationTest`:
   - `uploadEvidence_nonExistentVisit_returns404NotFound`: `POST /api/v1/visits/{uuidInexistente}/evidences` devuelve 404 `visit_not_found` y no deja archivos en `storageService`.
   - `getEvidenceFile_nonExistentEvidence_returns404NotFound`: `GET /api/v1/visits/{visitId}/evidences/{uuidInexistente}/file` devuelve 404 `evidence_not_found`.
   - `getManifest_visitWithoutManifest_returns404NotFound`: `GET /api/v1/visits/{visitIdSinManifiesto}/manifest` devuelve 404 `manifest_not_found`.
   - `verifyManifest_visitWithoutManifest_returns404NotFound`: `POST /api/v1/visits/{visitIdSinManifiesto}/manifest/verify` devuelve 404 `manifest_not_found`.
   - `uploadEvidence_missingFile_returns400BadRequest`: los casos inválidos siguen respondiendo 400.
   - `uploadEvidence_integrityMismatch_returns400IntegrityMismatch`: discrepancias de hash siguen respondiendo 400 `integrity_mismatch`.
