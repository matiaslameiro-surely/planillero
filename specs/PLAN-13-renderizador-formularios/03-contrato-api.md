# Contrato de API - PLAN-13

> Emitido por el backend (ya en `main` tras PLAN-7). Los frontends lo consumen tal cual.
> Endpoints, verbos, request/response de ejemplo y códigos de error.

## Autenticación y autorización

- Todos los endpoints requieren `Authorization: Bearer <JWT>`.
- Roles: `OPERATOR` (móvil), `SUPERVISOR` / `ADMINISTRATOR` (backoffice).
- Jurisdicción: el operador solo ve plantillas y visitas de su zona (control horizontal OWASP A01).

---

## `GET /api/v1/plantillas`

**Descripción**: Catálogo de plantillas de formulario activas. Usado por el móvil para listar plantillas disponibles si la visita no tiene `form_template_id` preasignado.

**Permisos**: `OPERATOR`, `SUPERVISOR`, `ADMINISTRATOR`.

**Parámetros**: ninguno.

**Respuesta `200`**:

```json
[
  {
    "id": "aaaaaaaa-0001-4000-8000-000000000001",
    "key": "mantenimiento-general",
    "version": 2,
    "name": "Mantenimiento general",
    "description": "Parte de mantenimiento. Suma número de serie y requerimiento de seguimiento.",
    "createdAt": "2026-09-18T15:30:00Z"
  },
  {
    "id": "aaaaaaaa-0002-4000-8000-000000000001",
    "key": "control-de-acceso",
    "version": 1,
    "name": "Control de acceso",
    "description": "Registro de ingreso y egreso en punto de control.",
    "createdAt": "2026-09-18T15:30:00Z"
  }
]
```

**Errores**: `401` (sin token / token inválido) · `403` (rol no autorizado).

---

## `GET /api/v1/plantillas/{clave}`

**Descripción**: Detalle completo de una plantilla, incluyendo su JSON Schema. Usado por móvil y backoffice para renderizar el formulario.

**Permisos**: `OPERATOR`, `SUPERVISOR`, `ADMINISTRATOR`.

**Parámetros de ruta**:

| Parámetro | Tipo | Descripción |
|---|---|---|
| `clave` | string | `key` de la plantilla (ej. `mantenimiento-general`) |

**Parámetros de query opcionales**:

| Parámetro | Tipo | Descripción |
|---|---|---|
| `version` | integer | Versión específica. Si omitido, devuelve la **última versión activa** (mayor `version`). |

**Respuesta `200`** (ejemplo `mantenimiento-general` v2):

```json
{
  "id": "aaaaaaaa-0001-4000-8000-000000000002",
  "key": "mantenimiento-general",
  "version": 2,
  "name": "Mantenimiento general",
  "description": "Parte de mantenimiento. Suma número de serie y requerimiento de seguimiento.",
  "createdAt": "2026-09-18T15:30:00Z",
  "schema": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "title": "Mantenimiento general",
    "type": "object",
    "additionalProperties": false,
    "required": ["workedHours", "taskType", "observations"],
    "properties": {
      "workedHours": {
        "title": "Horas trabajadas",
        "type": "number",
        "minimum": 0,
        "maximum": 24
      },
      "taskType": {
        "title": "Tipo de tarea",
        "type": "string",
        "enum": ["PREVENTIVO", "CORRECTIVO", "INSPECCION"]
      },
      "observations": {
        "title": "Observaciones",
        "type": "string",
        "maxLength": 500
      },
      "serialNumber": {
        "title": "Número de serie del equipo",
        "type": "string",
        "pattern": "^[A-Z]{3}-[0-9]{4}$"
      },
      "requiresFollowUp": {
        "title": "Requiere seguimiento",
        "type": "boolean"
      }
    }
  }
}
```

**Errores**: `404 { "error": "template_not_found" }` si la clave no existe o no hay versión activa · `401` · `403`.

---

## `POST /api/v1/visitas/{id}/formulario`

**Descripción**: Envía las respuestas de un formulario completado por el operador. Valida el payload contra el JSON Schema de la plantilla indicada y persiste en `visits.visits` (`form_template_id`, `respuestas_json`, `form_submitted_at`).

**Permisos**: `OPERATOR` (dueño de la visita o supervisor de su zona).

**Parámetros de ruta**:

| Parámetro | Tipo | Descripción |
|---|---|---|
| `id` | UUID | ID de la visita (`visits.visits.id`) |

**Request body**:

```json
{
  "templateKey": "mantenimiento-general",
  "templateVersion": 2,
  "responses": {
    "workedHours": 8,
    "taskType": "PREVENTIVO",
    "observations": "Cambio de filtro y revisión de correas.",
    "serialNumber": "ABC-1234",
    "requiresFollowUp": false
  }
}
```

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `templateKey` | string | Sí | Clave de la plantilla usada (debe coincidir con una activa) |
| `templateVersion` | integer | Sí | Versión exacta de la plantilla contra la que se validó |
| `responses` | object | Sí | Objeto con las respuestas; claves = `properties` del schema; valores = según `type` |

**Respuesta `200`**:

```json
{
  "visitId": "a0000001-0000-4000-8000-000000000001",
  "templateKey": "mantenimiento-general",
  "templateVersion": 2,
  "submittedAt": "2026-10-15T14:32:10Z"
}
```

**Validaciones y errores**:

| Código | Error | Cuándo |
|---|---|---|
| `400` | `template_not_found` | `templateKey` no existe o `templateVersion` no coincide con ninguna versión de esa clave |
| `400` | `validation_failed` | `responses` no pasa el JSON Schema (cuerpo del error incluye `FieldViolation[]` con `field`, `message`, `rejectedValue`) |
| `400` | `visit_not_found` | La visita `id` no existe |
| `403` | `visit_not_assigned` | La visita no está asignada al operador (ni a su zona si es supervisor) |
| `409` | `form_already_submitted` | La visita ya tiene formulario enviado (idempotencia: no se permite reenviar) |
| `401` | — | Sin token / token inválido |
| `403` | — | Rol no autorizado |

**Notas de implementación**:

- La validación usa `FormSchemaValidator` (ya en `main`) que compila el schema con `ajv` (Draft 2020-12) y lanza `FormValidationException` con lista de violaciones si falla.
- La persistencia es transaccional: si la validación falla, no se guarda nada.
- Inmutabilidad de plantillas públicas: una plantilla `active=true` no se edita; se publica versión nueva.

---

## `GET /api/v1/visitas/{id}/formulario`

**Descripción**: Obtiene el detalle de la visita junto con el formulario completado (si existe). Usado por el backoffice para mostrar el expediente de una visita.

**Permisos**: `SUPERVISOR`, `ADMINISTRATOR`.

**Parámetros de ruta**:

| Parámetro | Tipo | Descripción |
|---|---|---|
| `id` | UUID | ID de la visita (`visits.visits.id`) |

**Respuesta `200`** (visita con formulario):

```json
{
  "id": "a0000001-0000-4000-8000-000000000001",
  "code": "V-1001",
  "address": "Av. Cabildo 1234, CABA",
  "latitude": -34.543123,
  "longitude": -58.452123,
  "jurisdiction": "ZONA_NORTE",
  "status": "ASSIGNED",
  "urgency": "HIGH",
  "createdAt": "2026-09-18T15:30:00Z",
  "formTemplateId": "aaaaaaaa-0001-4000-8000-000000000002",
  "templateKey": "mantenimiento-general",
  "templateVersion": 2,
  "templateName": "Mantenimiento general",
  "responses": {
    "workedHours": 8,
    "taskType": "PREVENTIVO",
    "observations": "Cambio de filtro y revisión de correas.",
    "serialNumber": "ABC-1234",
    "requiresFollowUp": false
  },
  "submittedAt": "2026-10-15T14:32:10Z"
}
```

**Respuesta `200`** (visita sin formulario):

```json
{
  "id": "a0000001-0000-4000-8000-000000000001",
  "code": "V-1001",
  "address": "Av. Cabildo 1234, CABA",
  "latitude": -34.543123,
  "longitude": -58.452123,
  "jurisdiction": "ZONA_NORTE",
  "status": "ASSIGNED",
  "urgency": "HIGH",
  "createdAt": "2026-09-18T15:30:00Z",
  "formTemplateId": null,
  "templateKey": null,
  "templateVersion": null,
  "templateName": null,
  "responses": null,
  "submittedAt": null
}
```

**Errores**:

| Código | Error | Cuándo |
|---|---|---|
| `404` | `visit_not_found` | La visita `id` no existe |
| `401` | — | Sin token / token inválido |
| `403` | — | Rol no autorizado (requiere `SUPERVISOR` o `ADMINISTRATOR`) |

---

## Esquemas de referencia (TypeScript)

```typescript
// GET /api/v1/plantillas
export interface FormTemplateListItem {
  id: string;                    // UUID
  key: string;                   // ej. "mantenimiento-general"
  version: number;
  name: string;
  description: string;
  createdAt: string;             // ISO 8601
}

// GET /api/v1/plantillas/{clave}
export interface FormTemplateDetail extends FormTemplateListItem {
  schema: JsonSchema;            // JSON Schema completo (Draft 2020-12)
}

// POST /api/v1/visitas/{id}/formulario - Request
export interface FormSubmissionRequest {
  templateKey: string;
  templateVersion: number;
  responses: Record<string, unknown>;  // claves = properties del schema
}

// POST /api/v1/visitas/{id}/formulario - Response
export interface FormSubmissionResponse {
  visitId: string;
  templateKey: string;
  templateVersion: number;
  submittedAt: string;           // ISO 8601
}

// GET /api/v1/visitas/{id}/formulario - Response
export interface VisitFormDetailDto {
  id: string;
  code: string;
  address: string;
  latitude: number;
  longitude: number;
  jurisdiction: string;
  status: string;
  urgency: string;
  createdAt: string;             // ISO 8601
  formTemplateId: string | null;
  templateKey: string | null;
  templateVersion: number | null;
  templateName: string | null;
  responses: Record<string, unknown> | null;
  submittedAt: string | null;    // ISO 8601
}

// Error de validación (400 validation_failed)
export interface FieldViolation {
  field: string;                 // JSON Pointer ej. "/workedHours"
  message: string;               // mensaje legible
  rejectedValue: unknown;        // valor que falló
}
```

---

## Plantillas de seed (V10) - Resumen para testing

| key | version | required fields | tipos usados |
|---|---|---|---|
| `mantenimiento-general` | 1 | workedHours, taskType | number(min/max), string(enum), string(maxLength) |
| `mantenimiento-general` | 2 | workedHours, taskType, observations | + string(pattern), boolean |
| `control-de-acceso` | 1 | entryTime, exitTime, peopleCount | string(pattern HH:MM), integer(min/max), string(maxLength) |

> **Nota**: Los frontends deben soportar al menos estos tipos/keywords. Si el backend agrega plantillas con `oneOf`, `anyOf`, `const`, `dependencies`, etc., se considera cambio de alcance.