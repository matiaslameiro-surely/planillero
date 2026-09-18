# Plan técnico — PLAN-10

## Enfoque

Implementar un sistema integral de custodia digital pericial para fotografías de relevamiento y firmas ológrafas recolectadas durante visitas en terreno.

La arquitectura se apoya en tres pilares:
1. **Almacenamiento inmutable WORM:** Los binarios se transfieren mediante streaming con cálculo concurrente de SHA-256 y se depositan bajo identificadores UUID aleatorios (mitigando OWASP A04). Cualquier intento de sobreescritura es bloqueado. El motor de almacenamiento (`ObjectStorageService`) cuenta con soporte S3/MinIO y fallback local seguro determinístico para desarrollo y pruebas.
2. **Sellado criptográfico y cadena de custodia:** Al culminar la visita, un manifiesto canónico JSON consolida los metadatos de las evidencias (IDs, tipos, hashes SHA-256, tamaños), usuario actuante, dispositivo y marca temporal. El manifiesto se sella con una firma digital HMAC-SHA256 contra una clave simétrica del sistema. Un servicio de auditoría recalcula hashes y valida la firma para categorizar la visita como `VERIFIED` o `TAMPERED`.
3. **Experiencia de usuario pericial (Móvil y Web):** En el cliente móvil, lienzo táctil minimalista para firma con opciones de borrado/reintento y galería previa de miniaturas de fotos (Heurísticas UX 3 y 8). En el backoffice Angular, panel de supervisión con galería pericial, inspección de trazo, ficha de hashes SHA-256 y auditoría visual de integridad en tiempo real.

## Archivos a tocar

### backend/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/main/resources/db/migration/V4__evidence_and_manifests_schema.sql` | crear | Tablas `visits.evidences` y `visits.visit_manifests`, más sinónimos en esquema `visitas` |
| `src/main/java/ar/com/planillero/evidence/model/Evidence.java` | crear | Entidad JPA para registro de evidencias digitales |
| `src/main/java/ar/com/planillero/evidence/model/EvidenceType.java` | crear | Enum de tipo de evidencia (`PHOTO`, `SIGNATURE`) |
| `src/main/java/ar/com/planillero/evidence/model/VisitManifest.java` | crear | Entidad JPA para manifiesto firmado con HMAC |
| `src/main/java/ar/com/planillero/evidence/model/VerificationStatus.java` | crear | Enum de estado de verificación (`VERIFIED`, `TAMPERED`, `PENDING`) |
| `src/main/java/ar/com/planillero/evidence/repository/EvidenceRepository.java` | crear | Repositorio Spring Data JPA para evidencias |
| `src/main/java/ar/com/planillero/evidence/repository/VisitManifestRepository.java` | crear | Repositorio Spring Data JPA para manifiestos |
| `src/main/java/ar/com/planillero/evidence/storage/ObjectStorageService.java` | crear | Interfaz de almacenamiento WORM (Write Once, Read Many) |
| `src/main/java/ar/com/planillero/evidence/storage/LocalStorageService.java` | crear | Implementación WORM local con nombres UUID inmutables |
| `src/main/java/ar/com/planillero/evidence/storage/StorageProperties.java` | crear | Parámetros de configuración de almacenamiento y MinIO |
| `src/main/java/ar/com/planillero/evidence/crypto/CryptoService.java` | crear | Servicio de cálculo de hash SHA-256 en streaming y firma HMAC-SHA256 |
| `src/main/java/ar/com/planillero/evidence/service/EvidenceService.java` | crear | Lógica de negocio de ingesta multipart, validación previa de hash y consulta |
| `src/main/java/ar/com/planillero/evidence/service/ManifestService.java` | crear | Generación, firmado y verificación de integridad de manifiestos |
| `src/main/java/ar/com/planillero/evidence/controller/EvidenceController.java` | crear | Endpoints REST para ingesta de evidencias, descarga de archivos y sellado/verificación de manifiestos |
| `src/main/java/ar/com/planillero/evidence/dto/EvidenceResponse.java` | crear | DTO de respuesta para evidencia registrada |
| `src/main/java/ar/com/planillero/evidence/dto/CreateManifestRequest.java` | crear | DTO de solicitud de cierre de manifiesto |
| `src/main/java/ar/com/planillero/evidence/dto/ManifestResponse.java` | crear | DTO de respuesta de manifiesto firmado |
| `src/main/java/ar/com/planillero/evidence/dto/VerificationResultResponse.java` | crear | DTO de diagnóstico de verificación pericial |
| `src/main/resources/application.properties` | modificar | Propiedades de configuración para almacenamiento y secreto HMAC |
| `src/test/java/ar/com/planillero/evidence/CryptoServiceTest.java` | crear | Tests unitarios de SHA-256 con vectores conocidos NIST y detección de manipulación |
| `src/test/java/ar/com/planillero/evidence/EvidenceIntegrationTest.java` | crear | Tests de integración con Testcontainers para ingesta multipart, WORM y verificación HMAC |

### frontend/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/components/SignaturePad.tsx` | crear | Componente de lienzo táctil para firma ológrafa con acciones de limpiar y reintentar |
| `src/api/evidence.ts` | crear | Cliente API para subida multipart de evidencias con SHA-256 y sellado de manifiesto |
| `src/app/evidence/[visitId].tsx` | crear | Pantalla de captura pericial: fotos con miniaturas, lienzo de firma y sellado de visita |
| `src/api/client.ts` | modificar | Soporte para multipart/form-data y headers personalizados en `requestWithAuth` |
| `src/api/__tests__/evidence.test.ts` | crear | Tests unitarios de cliente de evidencias y cálculo de hash |

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/core/models/evidence.model.ts` | crear | Interfaces TypeScript para evidencias, manifiesto y diagnóstico pericial |
| `src/app/core/services/evidence.service.ts` | crear | Servicio Angular para consultar evidencias, binarios y verificar integridad del manifiesto |
| `src/app/pages/evidence-viewer/evidence-viewer.component.ts` | crear | Componente de visor pericial: galería de fotos, visor de firma y estado criptográfico |
| `src/app/pages/evidence-viewer/evidence-viewer.component.html` | crear | Plantilla con diseño de supervisión, badges de estado VERIFIED/TAMPERED y trazo de firma |
| `src/app/pages/evidence-viewer/evidence-viewer.component.scss` | crear | Estilos del visor pericial y visualización de cadena de custodia |
| `src/app/app.routes.ts` | modificar | Registro de la ruta `/evidence/:visitId` con protección de guardia de sesión |
| `src/app/core/services/__tests__/evidence.service.spec.ts` | crear | Tests unitarios del servicio de evidencias del backoffice |

## Decisiones técnicas

- **Almacenamiento desacoplado con interfaz `ObjectStorageService` y fallback determinístico:**
  *Se descartó* atar la aplicación exclusivamente a un MinIO en ejecución local porque rompería el gate determinístico de compilación y tests en máquinas donde el daemon de Docker o MinIO no esté levantado fuera de Testcontainers. La interfaz abstrae las operaciones S3 y permite operar de forma transparente con un MinIO real o con almacenamiento en disco seguro con las mismas garantías WORM.
- **Cálculo de SHA-256 en streaming mediante `DigestInputStream`:**
  *Se descartó* cargar todo el archivo en memoria (`byte[]`) o almacenarlo en disco temporal antes de hashearlo, porque consumiría memoria heap excesiva en fotos de alta resolución e introduciría latencias y riesgos de I/O temporal innecesario.
- **Firma digital con HMAC-SHA256 sobre JSON canónico:**
  *Se descartó* firmar cadenas arbitrarias o desordenadas. El manifiesto se serializa normalizando el orden de las evidencias por identificador para garantizar reproducibilidad exacta en cualquier verificador.
- **Nombres de archivo basados en UUID aleatorio (OWASP A04):**
  *Se descartó* usar el nombre original del archivo subido por el cliente en el almacenamiento para evitar ataques de enumeración, path traversal y colisiones.

## Contrato de API (alto nivel)

| Método | Ruta | Request | Response |
|---|---|---|---|
| `POST` | `/api/v1/visits/{visitId}/evidences` | `multipart/form-data` (`file`, `type`, `capturedAt`, `metadata`), header opcional `X-Content-SHA256` | `201 Created` con `{ id, visitId, evidenceType, sha256Hash, fileSize, capturedAt }` |
| `GET` | `/api/v1/visits/{visitId}/evidences` | Ninguno (autenticado) | `200 OK` con lista de evidencias |
| `GET` | `/api/v1/visits/{visitId}/evidences/{evidenceId}/file` | Ninguno (autenticado) | `200 OK` con binario (`image/jpeg`, `image/png`) |
| `POST` | `/api/v1/visits/{visitId}/manifest` | `{ deviceInfo, evidenceIds }` | `201 Created` con `{ id, visitId, manifestData, hmacSignature, verificationStatus }` |
| `GET` | `/api/v1/visits/{visitId}/manifest` | Ninguno (autenticado) | `200 OK` con el manifiesto actual |
| `POST` | `/api/v1/visits/{visitId}/manifest/verify` | Ninguno o `{ manifestId }` | `200 OK` con `{ status: "VERIFIED"|"TAMPERED", hmacValid, evidencesSummary }` |

## Supuestos

- `app.crypto.hmac-secret` se resuelve mediante variable de entorno `HMAC_SECRET` con un valor por defecto robusto para desarrollo local.
- Las fotos y firmas se generan en formatos estándar de imagen web/móvil (`image/jpeg`, `image/png`).
- Las visitas son identificadas por un UUID válido.

## Cómo se prueba

1. **Tests unitarios criptográficos (`CryptoServiceTest`):**
   - Validación del algoritmo SHA-256 contra vectores de prueba estándar oficiales (cadenas vacías, hashes conocidos de NIST).
   - Verificación de HMAC-SHA256 contra claves y mensajes predecibles.
   - Detección de manipulación: alteración intencional de 1 byte en el archivo o en el manifiesto produce discrepancia inmediata de hash y veredicto `TAMPERED`.
2. **Tests de integración backend (`EvidenceIntegrationTest`):**
   - Subida multipart exitosa con verificación de cabecera `X-Content-SHA256`.
   - Rechazo de subida con `400 Bad Request` cuando el hash declarado difiere del stream real.
   - Creación de manifiesto firmado y consulta de verificación con respuesta `VERIFIED`.
   - Intento de sobreescritura de un UUID existente bloqueado por política WORM.
3. **Tests de frontend y backoffice:**
   - Pruebas unitarias de clientes API, renderizado y verificación de tipos.
   - Ejecución de `node .agents/scripts/verificar.mjs --tarea PLAN-10`.
