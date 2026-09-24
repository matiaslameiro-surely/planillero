# Contrato de API — PLAN-50

Este contrato cambia un solo endpoint. Todo lo que no se menciona sigue como lo describe
`specs/PLAN-12-task-11-tablero-central-de-supervision/03-contrato-api.md`.

## Endpoints

### `POST /api/v1/supervision/heartbeat`

**Para qué:** latido periódico del operador desde la app móvil, con telemetría del dispositivo.

**Autenticación:** requerida (Bearer JWT), rol `OPERATOR`.

**Request**

```json
{
  "batteryLevel": 0.8,
  "networkStatus": "ONLINE",
  "latitude": -34.54,
  "longitude": -58.45,
  "observations": "Recorrido sin incidentes"
}
```

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `batteryLevel` | number | no | Entre `0.0` y `1.0` |
| `networkStatus` | string | no | **Exactamente** `ONLINE`, `OFFLINE` o `UNKNOWN`, en mayúsculas. Cualquier otro valor (`"WIFI"`, `"online"`, `""`) da `400`. Si falta o es `null`, el turno conserva el valor que tenía; un turno nuevo arranca en `ONLINE` |
| `latitude` | number | no | Si falta, se conserva la anterior |
| `longitude` | number | no | Si falta, se conserva la anterior |
| `observations` | string | no | Se sanitiza contra XSS |

**Response 200** (sin cambios)

```json
{
  "success": true,
  "serverTimestamp": "2026-09-24T13:30:15Z",
  "status": "EN_CAMPO",
  "message": "Latido registrado exitosamente"
}
```

**Errores**

| Código | Cuándo | Cuerpo |
|---|---|---|
| 400 | `networkStatus` fuera de los tres valores admitidos | `{"error": "invalid_request", "message": "networkStatus: debe ser ONLINE, OFFLINE o UNKNOWN"}` |
| 400 | `batteryLevel` fuera de `[0.0, 1.0]` | `{"error": "invalid_request", "message": "batteryLevel: …"}` |
| 401 | Token ausente o vencido | — |
| 403 | El usuario no tiene rol `OPERATOR` | — |

Un pedido rechazado con `400` no toca el turno: no se actualizan la telemetría ni `lastHeartbeatAt`.

## Modelos compartidos

```ts
export type NetworkStatus = 'ONLINE' | 'OFFLINE' | 'UNKNOWN';

export interface HeartbeatPayload {
  batteryLevel?: number | null;
  networkStatus?: NetworkStatus | null;
  latitude?: number | null;
  longitude?: number | null;
  observations?: string;
}
```

## Notas para los clientes

- La app móvil ya manda sólo `ONLINE` u `OFFLINE`: no necesita cambios.
- En `GET /api/v1/supervision/operadores/estado`, `networkStatus` sigue siendo un `string` y sólo puede
  tomar esos tres valores.
