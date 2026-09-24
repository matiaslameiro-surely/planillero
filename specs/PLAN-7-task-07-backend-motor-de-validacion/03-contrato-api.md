# Contrato de API — PLAN-7

> **Actualización PLAN-49.** Los endpoints de este contrato que reciben una visita ahora exigen que
> la visita sea del usuario: el supervisor, de su jurisdicción (`403 outside_jurisdiction`); el
> operador, en una hoja de ruta propia (`403 visit_not_assigned`); el administrador, cualquiera. En el
> sync, esos rechazos vuelven como `FAILED` por operación. Detalle en
> `specs/PLAN-49-seguridad-los-endpoints-por-visita-no/03-contrato-api.md`.

Lo emite el backend. **Lo consume PLAN-13** (renderizador dinámico de formularios en el móvil) y
cualquier cliente que muestre o cargue formularios tipificados.

Todos los endpoints exigen `Authorization: Bearer <access token>` y están habilitados para los tres
roles (`OPERATOR`, `SUPERVISOR`, `ADMINISTRATOR`). Sin token: `401` con
`{"error": "unauthorized", ...}`.

---

## `GET /api/v1/plantillas`

Las plantillas **vigentes**, cada una en su última versión. Es la llamada que hace el cliente para
saber qué formularios puede ofrecer.

**Respuesta `200`**

```json
[
  {
    "id": "aaaaaaaa-0001-4000-8000-000000000002",
    "key": "mantenimiento-general",
    "version": 2,
    "name": "Mantenimiento general",
    "description": "Parte de mantenimiento. Suma número de serie del equipo y marca de seguimiento.",
    "schema": {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "title": "Mantenimiento general",
      "type": "object",
      "additionalProperties": false,
      "required": ["workedHours", "taskType", "observations"],
      "properties": {
        "workedHours":  { "title": "Horas trabajadas", "type": "number", "minimum": 0, "maximum": 24 },
        "taskType":     { "title": "Tipo de tarea", "type": "string", "enum": ["PREVENTIVO", "CORRECTIVO", "INSPECCION"] },
        "observations": { "title": "Observaciones", "type": "string", "maxLength": 500 },
        "serialNumber": { "title": "Número de serie del equipo", "type": "string", "pattern": "^[A-Z]{3}-[0-9]{4}$" },
        "requiresFollowUp": { "title": "Requiere seguimiento", "type": "boolean" }
      }
    },
    "createdAt": "2026-09-18T12:00:00Z"
  }
]
```

`schema` viaja como **JSON embebido**, no como texto escapado: se usa tal cual para armar los
campos. El `title` de cada propiedad es la etiqueta que hay que mostrar; si falta, se usa el nombre
de la propiedad.

---

## `GET /api/v1/plantillas/{clave}`

La última versión vigente de una plantilla puntual. Mismo objeto que un elemento de la lista.

| Código | Cuerpo | Cuándo |
|---|---|---|
| `200` | la plantilla | la clave existe y tiene una versión vigente |
| `404` | `{"error": "template_not_found", "message": "..."}` | no existe la clave, o ninguna versión está vigente |

---

## `POST /api/v1/visitas/{id}/formulario`

Valida las respuestas contra el schema de la plantilla y, sólo si cumplen, las guarda en la visita.
**Nada se persiste si la validación falla.**

**Request**

```json
{
  "templateKey": "mantenimiento-general",
  "templateVersion": 2,
  "responses": {
    "workedHours": 7.5,
    "taskType": "CORRECTIVO",
    "observations": "Se reemplazó el rodamiento.",
    "serialNumber": "XYZ-0042",
    "requiresFollowUp": true
  }
}
```

| Campo | Obligatorio | Nota |
|---|---|---|
| `templateKey` | sí | clave de la plantilla |
| `templateVersion` | no | si no viene, se usa la última versión vigente. **Mandala** si el formulario se completó offline: garantiza que se valide con las mismas reglas que se mostraron, o que se rechace con `template_inactive` si esa versión se dio de baja mientras tanto |
| `responses` | sí | objeto con la forma que declare el schema |

**Respuesta `200`**

```json
{
  "visitId": "bbbbbbbb-0001-4000-8000-000000000001",
  "templateKey": "mantenimiento-general",
  "templateVersion": 2,
  "submittedAt": "2026-09-18T15:30:00Z"
}
```

`templateVersion` en la respuesta es la versión **efectivamente usada**: si no se mandó ninguna,
acá vuelve cuál se resolvió.

**Respuesta `400` — el formulario no cumple el schema**

```json
{
  "error": "form_validation_failed",
  "message": "El formulario tiene 3 campos con problemas.",
  "violations": [
    { "field": "/observations", "rule": "required", "message": "El campo «observations» es obligatorio." },
    { "field": "/taskType",     "rule": "enum",     "message": "El valor debe ser uno de: PREVENTIVO, CORRECTIVO, INSPECCION." },
    { "field": "/workedHours",  "rule": "maximum",  "message": "El valor debe ser menor o igual que 24." }
  ]
}
```

Vienen **todas** las violaciones, no la primera: el cliente puede marcar todos los campos con
problema de una sola pasada.

| Campo de `violations[]` | Qué es |
|---|---|
| `field` | ruta del campo en **JSON Pointer** (`/workedHours`). Es la ruta dentro de `responses` |
| `rule` | palabra clave de JSON Schema incumplida. **Es estable**: decidí con esto, no con el texto |
| `message` | mensaje en español, listo para mostrar |

Valores de `rule` que emite hoy el motor: `required`, `type`, `enum`, `const`, `minimum`, `maximum`,
`exclusiveMinimum`, `exclusiveMaximum`, `multipleOf`, `minLength`, `maxLength`, `pattern`, `format`,
`minItems`, `maxItems`, `uniqueItems`, `additionalProperties`. Cualquier otra palabra clave del
estándar también se reporta, con el mensaje que da la librería.

**Otros errores**

| Código | `error` | Cuándo |
|---|---|---|
| `404` | `visit_not_found` | la visita del path no existe |
| `400` | `template_not_found` | la clave o la versión de plantilla no existen |
| `400` | `template_inactive` | la versión indicada existe pero fue dada de baja. El cliente tiene que descargar la vigente (`GET /api/v1/plantillas/{clave}`) y volver a completar el formulario |
| `400` | `invalid_request` | falta `templateKey` o `responses` en el sobre del pedido |
| `401` | `unauthorized` | sin token o con token vencido |

---

## Notas para el cliente

- **Una plantilla publicada nunca cambia.** Podés cachear `schema` por `(key, version)` para
  siempre. Lo que cambia es cuál es la versión vigente, así que revalidá la lista, no el contenido
  de una versión.
- **Validá en el cliente con el mismo schema** para dar respuesta inmediata, pero el servidor
  siempre revalida: su resultado es el que manda.
- `additionalProperties: false` es habitual en estas plantillas. No agregues campos propios al
  objeto `responses` (metadatos, banderas de UI): se rechazan. Si necesitás mandar algo más, se
  agrega al contrato, no al payload.
