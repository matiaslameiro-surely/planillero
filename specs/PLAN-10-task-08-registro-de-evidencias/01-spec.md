# PLAN-10 — TASK-08: Registro de Evidencias Digitales, Firma Digital y Manifiesto HMAC con SHA-256

## Contexto y problema

Durante la ejecución de inspecciones y visitas periciales en terreno, el sistema requiere capturar y custodiar evidencias digitales irrefutables: fotografías periciales del ambiente/domicilio y la firma ológrafa de las partes involucradas. Para asegurar la validez legal y procesal de los relevamientos, es indispensable garantizar la integridad absoluta de los datos, la no-repudiación y una cadena de custodia estricta que impida cualquier alteración o sustitución posterior.

Actualmente el sistema cuenta con la infraestructura base de base de datos PostgreSQL (PLAN-5) y el subsistema de autenticación centralizada con JWT y 2FA (PLAN-6), pero carece de un mecanismo para la ingesta segura de binarios periciales, el cálculo determinístico de hashes criptográficos y el sellado de la visita mediante un manifiesto firmado.

Esta tarea implementa el ciclo completo de captura, almacenamiento WORM (Write Once, Read Many), sellado criptográfico y visualización pericial en las tres capas del producto:
1. **Backend (Spring Boot):** Ingesta multipart en streaming hacia almacenamiento compatible S3/MinIO, cálculo concurrente de hash SHA-256 sin cargar archivos completos en memoria, almacenamiento inmutable con identificadores UUID aleatorios (mitigando OWASP A04 - Insecure Direct Object References), generación y validación de manifiestos JSON con firma HMAC-SHA256, y persistencia en esquemas PostgreSQL con estados de verificación.
2. **Frontend Móvil (React Native + Expo):** Flujo de captura fotográfica con previsualización en miniaturas antes de aceptar, lienzo táctil para firma ológrafa con acciones de limpieza y reintento (Heurística 3 de UX) y pantalla maximizada de trazo (Heurística 8 de UX), con cálculo previo de hash SHA-256 para validación local.
3. **Frontend Web / Backoffice (Angular):** Módulo/visor de evidencias y supervisión pericial con galería de fotos, inspección de trazo de firma, visualización de metadatos de auditoría (actor, dispositivo, timestamp) y verificación visual del estado de integridad del manifiesto (VERIFIED vs TAMPERED).

## Alcance

**Repos que toca:** `backend`, `frontend`, `backoffice`

## Criterios de aceptación

### 1. Modelo de datos y persistencia (PostgreSQL)
1.1. Se crea la migración Flyway `V4__evidence_and_manifests_schema.sql` en el backend dentro del esquema `visits` (con sinónimos o vistas en `visitas` para compatibilidad de dominio):
- Tabla `visits.evidences` (o `visits.evidence`):
  - `id`: UUID clave primaria generada aleatoriamente.
  - `visit_id`: UUID identificador de la visita.
  - `evidence_type`: VARCHAR(30) ('PHOTO', 'SIGNATURE').
  - `storage_path`: VARCHAR(255) ruta/clave única del objeto en MinIO/S3.
  - `file_name`: VARCHAR(255) nombre original o referencial.
  - `content_type`: VARCHAR(100) MIME type verificado.
  - `file_size`: BIGINT tamaño en bytes.
  - `sha256_hash`: VARCHAR(64) hash digest en minúsculas hexadecimal.
  - `captured_at`: TIMESTAMPTZ momento de captura informada por el cliente.
  - `created_at`: TIMESTAMPTZ momento de ingesta en backend.
  - `metadata`: JSONB metadatos periciales (geolocalización, modelo de cámara, actor, etc.).
- Tabla `visits.visit_manifests`:
  - `id`: UUID clave primaria.
  - `visit_id`: UUID identificador de la visita.
  - `user_id`: UUID referencia al usuario inspector (`core.users(id)`).
  - `device_info`: VARCHAR(255) información del dispositivo emisor.
  - `manifest_data`: JSONB contenido estructurado del manifiesto (metadatos de la visita, lista canónica de hashes y evidencias asociadas).
  - `hmac_signature`: VARCHAR(64) firma HMAC-SHA256 del contenido canónico del manifiesto.
  - `verification_status`: VARCHAR(30) estado ('VERIFIED', 'TAMPERED', 'PENDING').
  - `created_at`: TIMESTAMPTZ momento de sellado del manifiesto.

### 2. Backend: Ingesta en streaming, MinIO y Criptografía
2.1. El backend provee un servicio de almacenamiento de objetos (`ObjectStorageService`) desacoplado y compatible con MinIO/S3, configurado vía variables de entorno (`MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`), con fallback automático a almacenamiento seguro en sistema de archivos local para entornos de desarrollo/test sin MinIO externo.
2.2. Implementación de almacenamiento WORM (Write Once, Read Many): cada objeto se guarda bajo una clave UUID única generada por el servidor (`uuid.bin` o `uuid.jpg`). Cualquier intento de sobreescritura de un objeto existente es rechazado.
2.3. Endpoint `POST /api/v1/visits/{visitId}/evidences` (multipart/form-data):
- Recibe el archivo de evidencia binaria (foto o firma PNG/SVG), el tipo de evidencia (`PHOTO` | `SIGNATURE`), fecha de captura y metadatos opcionales.
- Procesa el stream de entrada calculando el SHA-256 en una sola pasada (usando `DigestInputStream` o stream pipe) mientras transmite los bytes al almacenamiento, sin volcar archivos temporales no controlados ni cargar binarios grandes en memoria heap.
- Si el cliente envía un hash previo en el header `X-Content-SHA256`, el backend valida que coincida exactamente; en caso de discrepancia, aborta con `400 Bad Request` indicando mismatch de integridad.
- Devuelve `201 Created` con el ID de la evidencia, metadatos, tamaño y hash SHA-256 calculado.
2.4. Endpoint `GET /api/v1/visits/{visitId}/evidences` y `GET /api/v1/visits/{visitId}/evidences/{evidenceId}/file`:
- Permite consultar la lista de evidencias asociadas a una visita.
- Permite descargar/visualizar el binario de la evidencia con sus encabezados de contenido adecuados.
2.5. Endpoint `POST /api/v1/visits/{visitId}/manifest`:
- Recibe la solicitud de generación y cierre de manifiesto de visita, conteniendo el `visitId`, metadatos de dispositivo y la lista de IDs de evidencias que componen la visita.
- Consolida las evidencias registradas en la base de datos, verifica que todas existan y pertenezcan a la visita, y serializa una representación JSON canónica normalizada.
- Computa la firma digital HMAC-SHA256 del manifiesto utilizando la clave de sellado del sistema (`HMAC_SECRET`).
- Persiste el manifiesto con estado `VERIFIED` y devuelve el manifiesto completo firmado.
2.6. Endpoint `POST /api/v1/visits/{visitId}/manifest/verify`:
- Recibe o consulta el manifiesto registrado, recalcula el HMAC-SHA256 sobre los datos canónicos, verifica la existencia e integridad de los hashes de cada evidencia registrada, y responde con el veredicto criptográfico (`status`: `VERIFIED` o `TAMPERED`, y el detalle de cada evidencia).
2.7. Los endpoints están protegidos por autenticación JWT y roles adecuados (inspector / supervisor / admin).

### 3. Frontend Móvil (React Native + Expo)
3.1. Módulo de captura de evidencias periciales:
- Permite capturar o seleccionar fotos periciales del entorno/domicilio.
- Muestra miniaturas de las fotos capturadas antes de su confirmación final (Heurística UX 3: control y libertad).
- Permite eliminar o reintentar una foto antes del sellado.
3.2. Componente de firma táctil (`SignaturePad` / lienzo de firma):
- Interfaz de captura de trazo ológrafo en lienzo táctil optimizado para maximizar el área útil (Heurística UX 8: diseño limpio y minimalista).
- Botones explícitos de «Limpiar lienzo» y «Reintentar firma» (Heurística UX 3).
- Genera la imagen de la firma (PNG/Base64) al confirmar.
3.3. Cálculo de hash local y sincronización:
- Calcula el hash SHA-256 de los binarios antes o durante el envío al backend.
- Envía la evidencia vía multipart al endpoint de backend e informa el estado de la subida.
3.4. Cierre y sellado de visita:
- Permite solicitar el cierre de la visita generando el manifiesto con las firmas y fotos recopiladas.

### 4. Frontend Web / Backoffice (Angular)
4.1. Módulo de supervisión pericial de evidencias (`EvidenceViewerComponent` / vista en módulo de visitas):
- Galería visual de fotografías periciales con visor ampliado y ficha técnica de cadena de custodia (fecha de captura, tamaño, nombre, hash SHA-256).
- Visor de firma pericial que permite inspeccionar con nitidez el trazo ológrafo de las partes.
- Panel de estado del manifiesto criptográfico: indicador visual prominente de verificación (`VERIFIED` en verde con sello de integridad, o `TAMPERED` en rojo en caso de alteración), visualización de firma HMAC-SHA256, dispositivo de captura y usuario responsable.
- Botón de «Verificar Integridad» que consulta `POST /api/v1/visits/{visitId}/manifest/verify` y refresca el diagnóstico en tiempo real.

### 5. Pruebas y Verificación
5.1. Backend:
- Tests unitarios de cálculo de hash SHA-256 frente a vectores de prueba conocidos (vectores estándar NIST/RFC).
- Tests de detección de manipulación de binarios (verificación de que un solo bit modificado altera el SHA-256 y marca el manifiesto como `TAMPERED`).
- Tests de generación y verificación de firma HMAC-SHA256.
- Tests de integración de controladores y almacenamiento WORM (rechazo de sobreescritura, nombres UUID aleatorios).
5.2. Frontend móvil y Backoffice:
- Chequeo estricto de tipos TypeScript (`tsc --noEmit` y `ng build`).
- Linter sin errores ni advertencias (`expo lint`, `ng lint`).
- Tests unitarios de componentes en verde.
5.3. El comando `node .agents/scripts/verificar.mjs --tarea PLAN-10` pasa completamente en verde en los tres repositorios.

## Fuera de alcance

- Certificados digitales PKI X.509 de firma electrónica avanzada respaldados por entidades certificadoras externas (se utiliza HMAC-SHA256 con almacenamiento seguro según especificación del issue).
- Módulo de sincronización offline con cola SQLite en el dispositivo (corresponde a las tareas de agenda offline TASK-04/TASK-05).
- Reconocimiento biométrico facial o peritaje caligráfico automatizado por IA.
- Modificación del esquema de autenticación OIDC/JWT ya establecido en PLAN-6.

## Preguntas abiertas

Ninguna.
