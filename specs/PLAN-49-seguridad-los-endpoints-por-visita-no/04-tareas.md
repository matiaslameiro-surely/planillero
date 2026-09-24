# Tareas — PLAN-49

## backend

- [x] `[backend]` Crear `VisitAccessGuard` con la regla de la spec (admin, supervisor por zona, operador por hoja de ruta; `404` antes que `403`)
- [x] `[backend]` `EvidenceService` y `ManifestService`: guardia primera en cada método; `loadEvidenceResource` recibe la `Evidence`
- [x] `[backend]` `EvidenceController`: pasar `authentication.getName()` a los seis endpoints
- [x] `[backend]` `VisitFormService` y `VisitFormController`: guardia en `submit` y `getFormDetail`
- [x] `[backend]` `SyncService`: guardia por operación antes de la detección de repetidas; javadoc de `submitDeferred`
- [x] `[backend]` `VisitFixtures` y ajuste de las cinco clases de test existentes a visitas asignadas
- [x] `[backend]` `VisitAccessIntegrationTest` con la matriz completa de la spec
- [x] `[backend]` `security-log.md`: riesgo de control de acceso horizontal
- [x] `[backend]` Emitir `03-contrato-api.md` y la nota en los contratos de PLAN-7, PLAN-10, PLAN-13 y PLAN-14

## Verificación

- [x] Gates en verde en los repos del alcance (`node .agents/scripts/verificar.mjs`)
- [x] Revisión independiente sin hallazgos `critical` ni `high`
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto
