# Tareas — PLAN-10

## backend

- [ ] `[backend]` Migración Flyway `V4__evidence_and_manifests_schema.sql` con tablas `visits.evidences` y `visits.visit_manifests`
- [ ] `[backend]` Entidades JPA y repositorios (`Evidence`, `VisitManifest`, `EvidenceRepository`, `VisitManifestRepository`)
- [ ] `[backend]` Módulo criptográfico `CryptoService` (SHA-256 en streaming y firma HMAC-SHA256)
- [ ] `[backend]` Módulo de almacenamiento WORM `ObjectStorageService` y `LocalStorageService` con soporte MinIO
- [ ] `[backend]` Servicios de negocio `EvidenceService` y `ManifestService`
- [ ] `[backend]` Controlador REST `EvidenceController` y DTOs de transferencia
- [ ] `[backend]` Tests unitarios y de integración (`CryptoServiceTest`, `EvidenceIntegrationTest`)
- [ ] `[backend]` Emitir `03-contrato-api.md` *(obligatorio si el alcance incluye algún cliente)*

## frontend *(app móvil)*

- [ ] `[frontend]` Leer `03-contrato-api.md` antes de empezar
- [ ] `[frontend]` Ajustar cliente HTTP en `src/api/client.ts` para soporte de subida multipart
- [ ] `[frontend]` Cliente de API de evidencias `src/api/evidence.ts` con cálculo local de SHA-256
- [ ] `[frontend]` Componente de lienzo de firma ológrafa `src/components/SignaturePad.tsx` (limpiar y reintentar trazo)
- [ ] `[frontend]` Pantalla de captura pericial `src/app/evidence/[visitId].tsx` (miniaturas de fotos, firma y sellado)
- [ ] `[frontend]` Tests unitarios y validación de tipos (`tsc --noEmit`, `expo lint`)

## backoffice *(web)*

- [ ] `[backoffice]` Leer `03-contrato-api.md` antes de empezar
- [ ] `[backoffice]` Modelos TypeScript `src/app/core/models/evidence.model.ts`
- [ ] `[backoffice]` Servicio Angular `src/app/core/services/evidence.service.ts`
- [ ] `[backoffice]` Componente visor pericial `EvidenceViewerComponent` (galería, visor de firma, estado VERIFIED/TAMPERED)
- [ ] `[backoffice]` Registro de ruta `/evidence/:visitId` en `app.routes.ts`
- [ ] `[backoffice]` Tests unitarios del servicio y compilación Angular (`ng build`, `ng test`, `ng lint`)

## Verificación

- [ ] Gates en verde en los repos del alcance (`node .agents/scripts/verificar.mjs`)
- [ ] Revisión independiente sin hallazgos `critical` ni `high`
- [ ] Cada criterio de aceptación de `01-spec.md` queda cubierto
