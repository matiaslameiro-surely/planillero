# PLAN-14 — Contrato de API

Lo emite el backend. Es la entrada obligatoria de `frontend` y `backoffice`: ningún cliente declara
nada que no esté acá.

## `POST /api/v1/sync/batch`

Aplica un lote de operaciones que el operador completó sin conexión.

**Autenticación:** `Authorization: Bearer <jwt>`. Roles: `OPERATOR`, `SUPERVISOR`, `ADMINISTRATOR`.

**Header obligatorio**

| Header | Valor | Qué pasa si falta o está mal |
|---|---|---|
| `Idempotency-Key` | UUID **versión 4** | `400 idempotency_key_required` / `400 idempotency_key_invalid` |

La clave identifica **el envío**, no el intento: todos los reintentos del mismo lote la repiten. Un
lote distinto usa una clave nueva.

### Pedido

```json
{
  "operations": [
    {
      "clientOperationId": "3f2b8c14-6d5e-4a2f-9c31-7b0e5a4d8f21",
      "type": "VISIT_FORM",
      "visitId": "a0000001-0000-4000-8000-000000000001",
      "form": {
        "templateKey": "mantenimiento-general",
        "templateVersion": 2,
        "responses": {
          "workedHours": 6.5,
          "taskType": "PREVENTIVO",
          "observations": "Sin novedades."
        }
      }
    }
  ]
}
```

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `operations` | array | sí | Entre 1 y 100 elementos |
| `operations[].clientOperationId` | UUID v4 | sí | Lo genera el dispositivo al **encolar** y no cambia entre reintentos |
| `operations[].type` | enum | sí | Hoy sólo `VISIT_FORM` |
| `operations[].visitId` | UUID | sí | La visita sobre la que se opera |
| `operations[].form` | objeto | sí | Idéntico al cuerpo de `POST /api/v1/visitas/{id}/formulario` |
| `operations[].form.templateVersion` | entero | no | Si falta, se usa la última versión vigente |

### Respuesta `200`

```json
{
  "results": [
    {
      "clientOperationId": "3f2b8c14-6d5e-4a2f-9c31-7b0e5a4d8f21",
      "status": "APPLIED",
      "form": {
        "visitId": "a0000001-0000-4000-8000-000000000001",
        "templateKey": "mantenimiento-general",
        "templateVersion": 2,
        "submittedAt": "2026-09-21T11:58:03.412Z"
      },
      "error": null,
      "message": null
    }
  ]
}
```

Un resultado por operación, **en el mismo orden** en que llegaron.

| `status` | Qué significa | Qué hace el cliente |
|---|---|---|
| `APPLIED` | Se guardó ahora | Saca la operación de la cola |
| `DUPLICATE` | Ya estaba aplicada; no se escribió nada. `form` es la confirmación **original** | Saca la operación de la cola: es un éxito |
| `FAILED` | No se pudo aplicar. `error` y `message` explican por qué | No la reintenta tal cual: el dato está mal |

Códigos de `error` posibles en `FAILED`: `visit_not_found`, `template_not_found`,
`template_inactive`, `form_validation_failed`, `operation_conflict`, `operation_id_invalid`.

> El `clientOperationId` se exige UUID **versión 4** con variante RFC 4122, igual que la clave de
> lote. Si no lo es, esa operación vuelve como `FAILED operation_id_invalid` y **las demás del lote
> se procesan igual**. El motivo es el mismo que para la clave: un identificador previsible puede
> repetirse entre dispositivos, y entonces un acta se daría por aplicada sin haberse guardado nunca.

> **El lote responde `200` aunque alguna operación falle.** El código HTTP dice si el envío se
> procesó, no si todos los datos eran válidos. Si una operación con un dato mal hiciera fallar el
> pedido entero, un formulario roto le costaría al operador la jornada completa.

### Errores del lote

| HTTP | `error` | Cuándo |
|---|---|---|
| `400` | `idempotency_key_required` | Falta el header |
| `400` | `idempotency_key_invalid` | El header no es un UUID v4 |
| `400` | `invalid_request` | El lote viene vacío, con más de 100 operaciones o con un campo obligatorio ausente |
| `401` | — | Sin token o con token vencido |
| `403` | — | El rol no alcanza |
| `409` | `idempotency_key_reused` | La clave ya se usó para **otro** cuerpo, o pertenece a otro usuario |
| `409` | `idempotency_key_in_progress` | Hay otro envío con esa clave procesándose ahora mismo. Se puede reintentar |

Ante un `409 idempotency_key_in_progress` el cliente **reintenta con la misma clave** después de una
espera: el envío original puede estar por terminar. Ante `idempotency_key_reused`, no: esa clave ya
no le sirve.

**Una reserva sin cerrar vence a los 2 minutos.** Si el servidor cae entre que reserva la clave y
que guarda la respuesta, esa clave quedaría trabada y el dispositivo recibiría `409` para siempre.
Pasado ese plazo, el siguiente envío con la misma clave la retoma y procesa el lote. Retomarla no
puede duplicar nada: lo que el envío original hubiera alcanzado a aplicar vuelve como `DUPLICATE`
por su `clientOperationId`.

### Las dos garantías

1. **Por lote.** Reenviar el mismo cuerpo con la misma clave devuelve **byte por byte** la respuesta
   del primer envío, incluido el `submittedAt`, y no escribe nada.
2. **Por operación.** La misma `clientOperationId`, aunque viaje en otro lote y con otra clave, se
   aplica una sola vez. Es lo que cubre al cliente que recorta o reagrupa su cola.

## `GET /api/v1/visits` — campos nuevos

Cada visita suma dos campos. El resto de la respuesta no cambia.

| Campo | Tipo | Notas |
|---|---|---|
| `syncedDeferred` | boolean | `true` si el formulario llegó por `POST /api/v1/sync/batch` |
| `syncedAt` | string ISO-8601 o `null` | Cuándo se recibió esa sincronización |

```json
{
  "id": "a0000001-0000-4000-8000-000000000001",
  "code": "V-1001",
  "address": "Av. Cabildo 1234, CABA",
  "latitude": -34.543123,
  "longitude": -58.452123,
  "status": "COMPLETED",
  "urgency": "HIGH",
  "syncedDeferred": true,
  "syncedAt": "2026-09-21T11:58:03.412Z"
}
```

Los mismos campos aparecen en las visitas embebidas en `RouteSheet`, que reutiliza esta forma.
