# Tareas — PLAN-80

## backoffice *(web)*

- [x] `[backoffice]` Agregar `getEvidenceFileBlob` en `src/app/core/services/evidence.service.ts` y test en `evidence.service.spec.ts`
- [x] `[backoffice]` Actualizar `docker/nginx.conf` agregando `blob:` a `img-src` en la CSP y agregar test en `nginx-guard.spec.ts`
- [x] `[backoffice]` Implementar en `EvidenceViewer` (`evidence-viewer.ts`, `evidence-viewer.html`, `evidence-viewer.scss`) la carga de blobs con `createObjectURL`, manejo de estados de error/carga y ciclo de vida `OnDestroy` con `revokeObjectURL`
- [x] `[backoffice]` Agregar tests unitarios en `evidence-viewer.spec.ts` para carga exitosa, estado de error y revocación al desmontar

## Verificación

- [x] Gates en verde en los repos del alcance (`node .agents/scripts/verificar.mjs`)
- [x] Revisión independiente sin hallazgos `critical` ni `high`
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto
