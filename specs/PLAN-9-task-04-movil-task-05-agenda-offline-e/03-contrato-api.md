# Contrato de API — PLAN-9

Emitido por el backend (commit `0e80603`) y consumido por el móvil. Si un cliente necesita algo que no está
acá, no lo inventa: vuelve al backend y este contrato se actualiza para todos.

Todos los endpoints exigen `Authorization: Bearer <accessToken>` y rol `OPERATOR`. Los errores tienen siempre
la forma `{ "error": "<código>", "message": "<texto en español>" }`, salvo los de autenticación del framework
(401 sin token), que pueden traer otro cuerpo.

## Endpoints

### `GET /api/v1/operators/me/route-sheet?date=YYYY-MM-DD`

**Para qué:** la agenda del operador autenticado para una fecha. Es lo que baja la app para guardarlo en SQLite.

**Autenticación:** requerida, rol `OPERATOR`. Siempre devuelve la hoja del propio usuario; no acepta un
identificador de operador.

**Request:** sólo el parámetro de query `date` (fecha ISO, sin hora), obligatorio.

**Response 200**

```json
{
  "operatorId": "11111111-1111-4111-8111-111111111111",
  "operatorUsername": "operador.demo",
  "date": "2026-11-01",
  "items": [
    {
      "position": 1,
      "visit": {
        "id": "a0000001-0000-4000-8000-000000000001",
        "code": "V-1001",
        "address": "Av. Cabildo 1234, CABA",
        "latitude": -34.543123,
        "longitude": -58.452123,
        "status": "ASSIGNED",
        "urgency": "HIGH"
      }
    }
  ]
}
```

`items` viene ordenado por `position` (las visitas más urgentes primero) y puede estar vacío.

**Errores**

| Código | Cuándo | Cuerpo |
|---|---|---|
| 400 | Falta `date` o no tiene formato `YYYY-MM-DD` | Respuesta por defecto de Spring |
| 401 | Sin token o token vencido | — |
| 403 | El usuario no tiene rol `OPERATOR` (por ejemplo, un supervisor) | `{"error":"forbidden", ...}` |

### `POST /api/v1/visits/{id}/start`

**Para qué:** iniciar una visita y dejar asentada la presencia del operador: ubicación, precisión del GPS y la
doble referencia temporal (reloj del dispositivo y reloj del servidor).

**Autenticación:** requerida, rol `OPERATOR`. La visita tiene que figurar en una hoja de ruta del operador.

**Request**

```json
{
  "latitude": -34.603712,
  "longitude": -58.381593,
  "accuracyMeters": 8.5,
  "clientTimestamp": "2026-10-20T14:59:30Z"
}
```

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `latitude` | número | sí | Entre -90 y 90. Se guarda con 6 decimales |
| `longitude` | número | sí | Entre -180 y 180. Se guarda con 6 decimales |
| `accuracyMeters` | número | sí | De 0 a 999999. Se guarda con 2 decimales |
| `clientTimestamp` | texto ISO-8601 con zona | sí | Hora del **reloj del dispositivo** al capturar la ubicación. Usar `Z` (UTC) |

**Response 200**

```json
{
  "visitId": "a0000001-0000-4000-8000-000000000001",
  "status": "IN_PROGRESS",
  "latitude": -34.603712,
  "longitude": -58.381593,
  "accuracyMeters": 8.50,
  "startedAtDevice": "2026-10-20T14:59:30Z",
  "startedAtServer": "2026-10-20T15:00:00Z",
  "driftSeconds": 30
}
```

`driftSeconds` es `startedAtServer − startedAtDevice`, en segundos, redondeado al más cercano. Es **positivo**
cuando el dispositivo está atrasado y **negativo** cuando está adelantado. Las coordenadas y la precisión
vuelven con la escala con la que se persistieron: es lo que hay que mostrar en el bloque no editable.

**Errores**

| Código | Cuándo | Cuerpo |
|---|---|---|
| 400 | Falta un campo, una coordenada está fuera de rango, la precisión es negativa | `{"error":"invalid_request","message":"latitude: ..."}`: el mensaje empieza con el nombre del campo |
| 400 | El cuerpo no es JSON válido o `clientTimestamp` no es una fecha | Respuesta por defecto de Spring |
| 401 | Sin token o token vencido | — |
| 403 | El usuario no tiene rol `OPERATOR` | `{"error":"forbidden", ...}` |
| 403 | La visita existe pero no está en una hoja de ruta de este operador | `{"error":"visit_not_assigned", ...}` |
| 404 | La visita no existe | `{"error":"visit_not_found", ...}` |
| 409 | La visita no está `ASSIGNED` (ya iniciada, completada o cancelada) | `{"error":"visit_not_startable", ...}` |

Un 409 **no modifica** los datos del primer inicio. Si el usuario toca el botón dos veces, el segundo pedido
recibe 409: la app lo tiene que tratar como "ya estaba iniciada" y refrescar la agenda, no como un fallo.

## Modelos compartidos

```ts
type VisitStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
type VisitUrgency = 'LOW' | 'MEDIUM' | 'HIGH';

interface Visit {
  id: string;            // UUID
  code: string;
  address: string;
  latitude: number;
  longitude: number;
  status: VisitStatus;
  urgency: VisitUrgency;
}

interface RouteSheet {
  operatorId: string;    // UUID
  operatorUsername: string;
  date: string;          // 'YYYY-MM-DD'
  items: { position: number; visit: Visit }[];
}

interface StartVisitRequest {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  clientTimestamp: string; // ISO-8601 con zona
}

interface StartVisitResponse {
  visitId: string;
  status: VisitStatus;     // 'IN_PROGRESS'
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  startedAtDevice: string; // ISO-8601, UTC
  startedAtServer: string; // ISO-8601, UTC
  driftSeconds: number;    // entero, con signo
}
```

## Notas para los clientes

- **`camelCase` en el JSON**, `snake_case` sólo en las columnas SQL. El issue nombraba los campos en
  `snake_case` (`client_timestamp`, `drift_seconds`); el contrato real es `clientTimestamp` y `driftSeconds`.
- **Rutas en inglés** (`/visits/{id}/start`, `/operators/me/route-sheet`), no `/visitas/{id}/iniciar`.
- **La fecha de la agenda** la elige el cliente. El backend no valida que la visita se inicie el mismo día de
  su hoja de ruta.
- **Sin vencimiento ni SLA:** la visita no trae esos datos (PLAN-8 los dejó fuera).
- **Una visita `IN_PROGRESS` ya no se puede reasignar** desde el backoffice (`POST /visits/assign` responde
  400 `visit_not_assignable`). Cambio de PLAN-9 sobre el endpoint de PLAN-8.
- **Limitación conocida:** `assign` de PLAN-8 no bloquea la fila de la visita. Si un supervisor reasigna en el
  mismo instante en que el operador inicia, podría pisar el estado. Es una ventana muy chica y queda fuera de
  esta tarea.
