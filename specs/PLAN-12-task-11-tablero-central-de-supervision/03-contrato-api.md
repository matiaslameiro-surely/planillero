# Contrato de API — PLAN-12

Emitido por el backend (Spring Boot) para el consumo de los clientes: **frontend móvil** (React Native + Expo) y **backoffice web** (Angular).

---

## Endpoints

### `GET /api/v1/supervision/tablero-resumen`

**Para qué:** Obtener el resumen analítico de métricas operativas (KPIs), contadores de estado de operadores, visitas y excepciones urgentes fuera de SLA.

**Autenticación:** Requerida (Bearer JWT). Roles permitidos: `SUPERVISOR`, `ADMINISTRATOR`.

**Query Parameters:**
- `date` (opcional, formato ISO `YYYY-MM-DD`): fecha del turno a consultar. Si se omite, toma la fecha actual del servidor.

**Request:** Ninguno (GET).

**Response 200 OK:**
```json
{
  "date": "2026-10-04",
  "jurisdiction": "ZONA_NORTE",
  "totalOperators": 2,
  "inFieldOperators": 1,
  "delayedOperators": 1,
  "offlineOperators": 0,
  "completedShiftOperators": 0,
  "totalVisits": 6,
  "pendingVisits": 4,
  "inProgressVisits": 1,
  "completedVisits": 1,
  "slaComplianceRate": 50.0,
  "exceptions": [
    {
      "operatorId": "44444444-4444-4444-8444-444444444444",
      "operatorUsername": "operador.norte2",
      "type": "OUT_OF_SLA",
      "severity": "HIGH",
      "message": "Operador demorado en visita fuera de SLA",
      "detectedAt": "2026-10-04T13:30:00Z"
    },
    {
      "operatorId": "44444444-4444-4444-8444-444444444444",
      "operatorUsername": "operador.norte2",
      "type": "LOW_BATTERY",
      "severity": "MEDIUM",
      "message": "Batería baja en dispositivo (18%)",
      "detectedAt": "2026-10-04T13:30:00Z"
    }
  ]
}
```

**Errores:**
| Código | Cuándo | Cuerpo |
|---|---|---|
| 401 | Token JWT ausente o inválido | `{"code": "unauthorized", "message": "..."}` |
| 403 | El usuario no tiene rol `SUPERVISOR` o `ADMINISTRATOR` | `{"code": "forbidden", "message": "..."}` |

---

### `GET /api/v1/supervision/operadores/estado`

**Para qué:** Obtener el listado reactivo de todos los operadores asignados en la jurisdicción del supervisor para la fecha, con su estado en vivo, telemetría y visita activa.

**Autenticación:** Requerida (Bearer JWT). Roles permitidos: `SUPERVISOR`, `ADMINISTRATOR`.

**Query Parameters:**
- `date` (opcional, formato ISO `YYYY-MM-DD`): fecha del turno. Si se omite, toma la fecha actual del servidor.

**Request:** Ninguno (GET).

**Response 200 OK:**
```json
[
  {
    "operatorId": "11111111-1111-4111-8111-111111111111",
    "username": "operador.demo",
    "jurisdiction": "ZONA_NORTE",
    "status": "EN_CAMPO",
    "batteryLevel": 0.82,
    "networkStatus": "ONLINE",
    "lastHeartbeatAt": "2026-10-04T13:28:00Z",
    "lastLatitude": -34.522345,
    "lastLongitude": -58.478901,
    "assignedVisitsCount": 3,
    "completedVisitsCount": 1,
    "activeVisitCode": "V-1002",
    "activeVisitAddress": "Av. Maipu 2450, Vicente Lopez",
    "activeVisitElapsedMinutes": 18,
    "slaStatus": "OK",
    "observations": "Operador en ruta normal cumpliendo SLA"
  },
  {
    "operatorId": "44444444-4444-4444-8444-444444444444",
    "username": "operador.norte2",
    "jurisdiction": "ZONA_NORTE",
    "status": "DEMORADO",
    "batteryLevel": 0.18,
    "networkStatus": "ONLINE",
    "lastHeartbeatAt": "2026-10-04T13:26:00Z",
    "lastLatitude": -34.543123,
    "lastLongitude": -58.452123,
    "assignedVisitsCount": 3,
    "completedVisitsCount": 0,
    "activeVisitCode": "V-1001",
    "activeVisitAddress": "Av. Cabildo 1234, CABA",
    "activeVisitElapsedMinutes": 52,
    "slaStatus": "DELAYED",
    "observations": "Demora por corte de transito y espera prolongada en domicilio"
  }
]
```

**Errores:**
| Código | Cuándo | Cuerpo |
|---|---|---|
| 401 | Token JWT ausente o inválido | `{"code": "unauthorized", "message": "..."}` |
| 403 | El usuario no tiene rol `SUPERVISOR` o `ADMINISTRATOR` | `{"code": "forbidden", "message": "..."}` |

---

### `POST /api/v1/supervision/heartbeat`

**Para qué:** Envío periódico de latido operativo desde la app móvil con telemetría del dispositivo (batería, estado de conectividad, coordenadas GPS).

**Autenticación:** Requerida (Bearer JWT). Rol permitido: `OPERATOR`.

**Request:**
```json
{
  "batteryLevel": 0.75,
  "networkStatus": "ONLINE",
  "latitude": -34.521122,
  "longitude": -58.479988,
  "observations": "Recorrido normal"
}
```

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `batteryLevel` | number | No | Valor normalizado entre `0.0` y `1.0` (o null si el OS no lo provee) |
| `networkStatus` | string | No | `ONLINE`, `OFFLINE` o `UNKNOWN` |
| `latitude` | number | No | Latitud GPS decimal (null si permisos denegados) |
| `longitude` | number | No | Longitud GPS decimal (null si permisos denegados) |
| `observations` | string | No | Notas o texto informativo (sanitizado contra XSS en backend) |

**Response 200 OK:**
```json
{
  "success": true,
  "serverTimestamp": "2026-10-04T13:30:15Z",
  "status": "EN_CAMPO",
  "message": "Latido registrado exitosamente"
}
```

**Errores:**
| Código | Cuándo | Cuerpo |
|---|---|---|
| 400 | Formato inválido o batteryLevel fuera de rango [0.0, 1.0] | `{"code": "bad_request", "message": "..."}` |
| 401 | Token ausente o expirado | `{"code": "unauthorized", "message": "..."}` |
| 403 | El usuario no tiene rol `OPERATOR` | `{"code": "forbidden", "message": "..."}` |

---

## Modelos compartidos (TypeScript)

```ts
export type ShiftStatus = 'EN_CAMPO' | 'DEMORADO' | 'OFFLINE' | 'TURNO_COMPLETO';

export type ExceptionSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export interface SupervisionException {
  operatorId: string;
  operatorUsername: string;
  type: string;
  severity: ExceptionSeverity;
  message: string;
  detectedAt: string;
}

export interface DashboardSummary {
  date: string;
  jurisdiction: string;
  totalOperators: number;
  inFieldOperators: number;
  delayedOperators: number;
  offlineOperators: number;
  completedShiftOperators: number;
  totalVisits: number;
  pendingVisits: number;
  inProgressVisits: number;
  completedVisits: number;
  slaComplianceRate: number;
  exceptions: SupervisionException[];
}

export interface OperatorLiveStatus {
  operatorId: string;
  username: string;
  jurisdiction: string;
  status: ShiftStatus;
  batteryLevel: number | null;
  networkStatus: string;
  lastHeartbeatAt: string;
  lastLatitude: number | null;
  lastLongitude: number | null;
  assignedVisitsCount: number;
  completedVisitsCount: number;
  activeVisitCode: string | null;
  activeVisitAddress: string | null;
  activeVisitElapsedMinutes: number | null;
  slaStatus: string;
  observations: string | null;
}

export interface HeartbeatPayload {
  batteryLevel?: number | null;
  networkStatus?: string;
  latitude?: number | null;
  longitude?: number | null;
  observations?: string;
}

export interface HeartbeatResult {
  success: boolean;
  serverTimestamp: string;
  status: ShiftStatus;
  message: string;
}
```

## Notas para los clientes

- **Control de Acceso Horizontal (OWASP A01):** Los supervisores únicamente reciben datos y alertas pertenecientes a su propia jurisdicción (`jurisdiction`). No es necesario que el cliente filtre por zona.
- **Detección Automática de Demoras y Desconexión:** El backend calcula automáticamente `DEMORADO` si una visita en curso excede los 45 minutos y `OFFLINE` si un operador activo no reporta latidos en más de 10 minutos.
- **Resiliencia Offline:** El cliente móvil debe intentar enviar el heartbeat silenciosamente; ante fallos de conexión no debe bloquear al usuario ni interrumpir la app.
- **Vocabulario y Equivalencias de UI:**
  - `EN_CAMPO` -> En campo / En ruta
  - `DEMORADO` -> Demorado
  - `OFFLINE` -> Offline / Desconectado
  - `TURNO_COMPLETO` -> Turno completo / Finalizado
