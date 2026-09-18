# Contrato de API — PLAN-8 (asignación y planificación de rutas)

Lo consumen `frontend` (app móvil) y `backoffice` (web). Lo emite el backend. Sólo el **backoffice**
está en el alcance de esta tarea; el contrato queda disponible para el móvil igual.

## General

- **Base URL (dev):** `http://localhost:8080`
- **Formato:** JSON (`Content-Type: application/json`) con base `/api/v1`.
- **Autenticación:** `Authorization: Bearer <accessToken>`. Todos los endpoints de este módulo
  requieren el rol `SUPERVISOR`; un `OPERATOR` (o sin token) recibe `403` / `401`.
- **Errores:** siempre `{ "error": "<codigo>", "message": "<texto en español>" }`.
- **Códigos:** `400` pedido inválido o no aplicable · `401` sin token · `403` rol insuficiente
  (`forbidden`) o fuera de jurisdicción (`outside_jurisdiction`) · `404` operador/visita inexistentes.
- **Alcance horizontal (OWASP A01):** todo endpoint recorta la respuesta a la **jurisdicción** del
  supervisor autenticado. Pedir un operador o visita de otra zona responde
  `403 { "error": "outside_jurisdiction" }`.
- **Fechas:** siempre `YYYY-MM-DD` (ISO-8601, zona local del servidor). Sin hora.

## Endpoints

### `GET /operators`

Supervisores. Devuelve los operadores de la **misma jurisdicción** que el supervisor, ordenados por
`username`.

Response `200`:
```json
[
  { "id": "44444444-4444-4444-8444-444444444444", "username": "operador.norte2", "jurisdiction": "ZONA_NORTE" },
  { "id": "11111111-1111-4111-8111-111111111111", "username": "operador.demo", "jurisdiction": "ZONA_NORTE" }
]
```

### `GET /operators/{operatorId}/route-sheets?date=YYYY-MM-DD`

Supervisores. Hoja de ruta de un operador para un día, ordenada por posición (1 = primero). Si el
día no tiene asignaciones, devuelve `items: []`.

Response `200`:
```json
{
  "operatorId": "11111111-1111-4111-8111-111111111111",
  "operatorUsername": "operador.demo",
  "date": "2026-10-15",
  "items": [
    {
      "position": 1,
      "visit": {
        "id": "a0000001-0000-4000-8000-000000000001",
        "code": "V-1001",
        "address": "Av. Cabildo 1234, CABA",
        "latitude": -34.543123,
        "longitude": -58.452123,
        "status": "PENDING",
        "urgency": "HIGH"
      }
    }
  ]
}
```

Errores: `404 { "error": "operator_not_found" }` si el operador no existe o no tiene rol `OPERATOR` ·
`403 outside_jurisdiction` si el operador es de otra zona.

### `GET /visits`

Supervisores. Visitas de la jurisdicción del supervisor, ordenadas por `code`. Filtros opcionales
combinables:

| Parámetro | Tipo | Notas |
|---|---|---|
| `status` | enum | `PENDING`, `ASSIGNED`, `COMPLETED`, `CANCELLED` |
| `urgency` | enum | `LOW`, `MEDIUM`, `HIGH` |
| `date` | `YYYY-MM-DD` | Restringe a visitas con hoja de ruta ese día |
| `operatorId` | UUID | Restringe a visitas asignadas a ese operador (cualquier día, salvo que también haya `date`) |

Response `200` (lista; cada elemento es el `visit` de los ejemplos de arriba).

### `POST /visits/assign`

Supervisores. Asigna un conjunto de visitas a un operador para una fecha y devuelve la hoja de ruta
actualizada del operador (todas sus visitas de ese día, ordenadas por urgencia: `HIGH` → `MEDIUM` →
`LOW`, y por `code` en empate). Posiciones nuevas: las visitas pendientes de hoy se suman **después**
de las que ya tenía la hoja.

Request:
```json
{
  "operatorId": "11111111-1111-4111-8111-111111111111",
  "date": "2026-10-15",
  "visitIds": ["a0000001-0000-4000-8000-000000000004", "a0000001-0000-4000-8000-000000000002"]
}
```

Semántica:

- Las visitas comparten zona con el supervisor; si alguna es de otra zona → `403 outside_jurisdiction`.
- Una visita ya asignada **al mismo operador** ese día → `400 visit_already_assigned` (no-op; no
  toca nada).
- Una visita ya asignada a **otro operador** ese día → se **reasigna**: se suelta de la hoja anterior
  y se suma a la nueva. Es atómico: o todas quedan en la hoja nueva o no queda ninguna.
- Una visita `COMPLETED` o `CANCELLED` → `400 visit_not_assignable`.
- Cuando se reasigna, la posición en la hoja de destino sigue la misma regla (después de lo existente).
- La asignación **persiste** `status = ASSIGNED` en la visita: pasa a ser visible para
  `GET /visits?status=ASSIGNED` (y deja de aparecer como `PENDING`). Es la señal que usa el móvil
  (PLAN-9) para saber que la visita ya tiene hoja de ruta.

Response `200` (igual cuerpo que `GET /operators/{id}/route-sheets`).

Errores: `404 visit_not_found` (al menos una visita no existe) · `404 operator_not_found` ·
`400 visit_already_assigned` · `400 visit_not_assignable` · `403 outside_jurisdiction`.

## Modelos compartidos

> Tipos que el cliente declara tal cual (los enums viajan como strings).

```ts
export type VisitStatus = 'PENDING' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';
export type VisitUrgency = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Operator {
  id: string;
  username: string;
  jurisdiction: string;
}

export interface Visit {
  id: string;
  code: string;
  address: string;
  latitude: number;
  longitude: number;
  status: VisitStatus;
  urgency: VisitUrgency;
}

export interface RouteSheetItem {
  position: number;
  visit: Visit;
}

export interface RouteSheet {
  operatorId: string;
  operatorUsername: string;
  date: string;          // YYYY-MM-DD
  items: RouteSheetItem[];
}

export interface AssignRequest {
  operatorId: string;
  date: string;          // YYYY-MM-DD
  visitIds: string[];
}
```

## Notas para los clientes

- **Rol:** el cliente habilita la pantalla de planificación sólo para roles `SUPERVISOR`. Los
  endpoints ya responden `403` si el token no tiene el rol.
- **Jurisdicción:** el backend filtra por el usuario autenticado; el cliente **no** manda la zona.
  Conviene mostrar la `jurisdiction` del supervisor en la cabecera de la pantalla para que sea
  evidente sobre qué zona se planifica.
- **Después de asignar/reasignar**, refrescar la vista con `GET /visits` y `GET
  /operators/{id}/route-sheets` del operador destino (y del origen si hubo reasignación): el único
  estado que cambia es la hoja de ruta.
- **`latitude`/`longitude`** vienen como número en el JSON (java `BigDecimal`); pueden ser usados
  directo por Leaflet.
- **Mapa:** el backoffice usa Leaflet + OpenStreetMap **sólo** para ubicar visitas; la grilla,
  filtros y asignación son componentes propios.
- **Seed ficticio de desarrollo** (para probar): jurisdicciones `ZONA_NORTE` (supervisor demo +
  operadores demo/norte2) y `ZONA_SUR` (operador sur). Visitas de ejemplo `V-1001`…`V-1006` (norte)
  y `V-2001`…`V-2002` (sur).