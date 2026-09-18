# Contrato de API — PLAN-10 (Evidencias Digitales y Manifiesto Criptográfico)

Contrato emitido por el backend para el consumo de `frontend` (móvil Expo) y `backoffice` (web Angular).

## General

- **Base URL (dev):** `http://localhost:8080`
- **Autenticación:** Requiere `Authorization: Bearer <accessToken>`.
- **Roles permitidos:** `OPERATOR`, `SUPERVISOR`, `ADMINISTRATOR`.
- **Manejo de Errores Uniforme:**
  ```json
  {
    "error": "<codigo_error>",
    "message": "<detalle explicativo en español>"
  }
  ```
- **Códigos HTTP de error:**
  - `400 Bad Request`: Parámetros inválidos o `integrity_mismatch` si el hash declarado no coincide.
  - `401 Unauthorized`: Token faltante o expirado.
  - `403 Forbidden`: Permisos insuficientes para la operación.
  - `404 Not Found`: Visita, evidencia o manifiesto no encontrado.
  - `409 Conflict`: `worm_policy_violation` al intentar sobreescribir un registro inmutable.

---

## Endpoints

### 1. Ingesta de Evidencia Pericial (Foto / Firma)

`POST /api/v1/visits/{visitId}/evidences`

- **Content-Type:** `multipart/form-data`
- **Headers Opcionales:**
  - `X-Content-SHA256`: Hash SHA-256 en hexadecimal calculado previamente en el cliente. Si se envía, el backend verifica que coincida exactamente con los bytes recibidos en streaming antes de aceptar la evidencia.
- **Form Fields:**
  - `file`: Binario del archivo (imagen JPG/PNG o firma). Obligatorio.
  - `type`: `PHOTO` o `SIGNATURE`. Opcional (default `PHOTO`).
  - `capturedAt`: Timestamp ISO-8601 de captura en el dispositivo. Opcional (default ahora).
  - `metadata`: String JSON opcional con metadatos periciales (e.g. coordenadas GPS, dispositivo, autor).

**Response `201 Created`:**
```json
{
  "id": "c1f7a264-58e1-4c12-8e11-9f9312345678",
  "visitId": "11111111-2222-3333-4444-555555555555",
  "evidenceType": "PHOTO",
  "fileName": "ambiente.jpg",
  "contentType": "image/jpeg",
  "fileSize": 102400,
  "sha256Hash": "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  "capturedAt": "2026-09-18T17:15:00Z",
  "createdAt": "2026-09-18T17:15:02Z",
  "metadata": "{\"geo\":{\"lat\":-34.6037,\"lng\":-58.3816}}"
}
```

**Response `400 Bad Request` (Discrepancia de integridad):**
```json
{
  "error": "integrity_mismatch",
  "message": "Discrepancia de integridad: el hash SHA-256 declarado por el cliente (...) no coincide con el calculado por el servidor (...)"
}
```

---

### 2. Listado de Evidencias de una Visita

`GET /api/v1/visits/{visitId}/evidences`

- **Response `200 OK`:**
```json
[
  {
    "id": "c1f7a264-58e1-4c12-8e11-9f9312345678",
    "visitId": "11111111-2222-3333-4444-555555555555",
    "evidenceType": "PHOTO",
    "fileName": "ambiente.jpg",
    "contentType": "image/jpeg",
    "fileSize": 102400,
    "sha256Hash": "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    "capturedAt": "2026-09-18T17:15:00Z",
    "createdAt": "2026-09-18T17:15:02Z",
    "metadata": "{\"geo\":{\"lat\":-34.6037,\"lng\":-58.3816}}"
  },
  {
    "id": "d2e8b375-69f2-5d23-9f22-0a0423456789",
    "visitId": "11111111-2222-3333-4444-555555555555",
    "evidenceType": "SIGNATURE",
    "fileName": "firma-inspector.png",
    "contentType": "image/png",
    "fileSize": 45120,
    "sha256Hash": "d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
    "capturedAt": "2026-09-18T17:18:00Z",
    "createdAt": "2026-09-18T17:18:01Z",
    "metadata": null
  }
]
```

---

### 3. Descarga / Visualización de Binario Pericial

`GET /api/v1/visits/{visitId}/evidences/{evidenceId}/file`

- **Headers devueltos:**
  - `Content-Type`: MIME type del archivo (`image/jpeg`, `image/png`).
  - `Content-Disposition`: `inline; filename="<nombre original>"`
  - `ETag`: `"<sha256Hash>"`
- **Response `200 OK`:** Stream binario directo.

---

### 4. Generación y Sellado de Manifiesto (Firma HMAC)

`POST /api/v1/visits/{visitId}/manifest`

- **Request Body (`Content-Type: application/json`):**
```json
{
  "deviceInfo": "Motorola Edge 40 - Android 14",
  "evidenceIds": [
    "c1f7a264-58e1-4c12-8e11-9f9312345678",
    "d2e8b375-69f2-5d23-9f22-0a0423456789"
  ]
}
```

- **Response `201 Created`:**
```json
{
  "id": "e3a9c486-70a3-6e34-0a33-1b1534567890",
  "visitId": "11111111-2222-3333-4444-555555555555",
  "userId": "11111111-1111-4111-8111-111111111111",
  "deviceInfo": "Motorola Edge 40 - Android 14",
  "manifestData": "{\"deviceInfo\":\"Motorola Edge 40 - Android 14\",\"evidences\":[{\"fileSize\":102400,\"id\":\"c1f7a264-58e1-4c12-8e11-9f9312345678\",\"sha256\":\"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad\",\"type\":\"PHOTO\"},{\"fileSize\":45120,\"id\":\"d2e8b375-69f2-5d23-9f22-0a0423456789\",\"sha256\":\"d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592\",\"type\":\"SIGNATURE\"}],\"userId\":\"11111111-1111-4111-8111-111111111111\",\"visitId\":\"11111111-2222-3333-4444-555555555555\"}",
  "hmacSignature": "8f2a1b9c4d3e5f60718293a4b5c6d7e8f9a0b1c2d3e4f5061728394a5b6c7d8e",
  "verificationStatus": "VERIFIED",
  "createdAt": "2026-09-18T17:20:00Z"
}
```

---

### 5. Consulta del Último Manifiesto Sellado

`GET /api/v1/visits/{visitId}/manifest`

- **Response `200 OK`:** Objeto `ManifestResponse` idéntico al emitido en el sellado.

---

### 6. Auditoría y Verificación Pericial de Integridad

`POST /api/v1/visits/{visitId}/manifest/verify`

Ejecuta la validación en tiempo constante del HMAC y re-calcula los hashes SHA-256 de todos los archivos en el almacenamiento WORM.

- **Response `200 OK` (Integridad Confirmada):**
```json
{
  "manifestId": "e3a9c486-70a3-6e34-0a33-1b1534567890",
  "visitId": "11111111-2222-3333-4444-555555555555",
  "status": "VERIFIED",
  "signatureValid": true,
  "allEvidencesIntact": true,
  "message": "Manifiesto y evidencias periciales verificadas íntegramente (HMAC y SHA-256 válidos)",
  "evidences": [
    {
      "evidenceId": "c1f7a264-58e1-4c12-8e11-9f9312345678",
      "sha256Expected": "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
      "sha256Actual": "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
      "intact": true,
      "status": "INTACT"
    },
    {
      "evidenceId": "d2e8b375-69f2-5d23-9f22-0a0423456789",
      "sha256Expected": "d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
      "sha256Actual": "d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
      "intact": true,
      "status": "INTACT"
    }
  ]
}
```

- **Response `200 OK` (Alerta de Alteración / Tampering):**
```json
{
  "manifestId": "e3a9c486-70a3-6e34-0a33-1b1534567890",
  "visitId": "11111111-2222-3333-4444-555555555555",
  "status": "TAMPERED",
  "signatureValid": true,
  "allEvidencesIntact": false,
  "message": "Alerta pericial: Se detectó alteración en la firma o en los binarios de evidencia (TAMPERED)",
  "evidences": [
    {
      "evidenceId": "c1f7a264-58e1-4c12-8e11-9f9312345678",
      "sha256Expected": "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
      "sha256Actual": "0000000000000000000000000000000000000000000000000000000000000000",
      "intact": false,
      "status": "TAMPERED"
    }
  ]
}
```
