# Contrato de API — PLAN-58

Emitido por el backend (commit `5f1ffea`) y consumido por la aplicación móvil (`frontend`).

Todos los endpoints exigen `Authorization: Bearer <accessToken>` y rol `OPERATOR`.
Los errores tienen siempre la estructura estándar del backend:
```json
{
  "error": "<código_de_error>",
  "message": "<descripción en español>"
}
```

---

## Endpoints

### `POST /api/v1/visits/{id}/complete`

**Para qué:** Permite al operador asignado finalizar una visita pericial que se encuentra en curso (`IN_PROGRESS`), registrando la culminación del servicio y asentando la traza en la cadena inmutable de auditoría.

**Autenticación:** Requerida, rol `OPERATOR`. La visita debe pertenecer a una hoja de ruta del operador autenticado (`VisitAccessGuard`).

**Parámetros de ruta:**
- `id` (UUID): Identificador único de la visita.

**Request Body:** Vacío.

**Response 200 OK:**
```json
{
  "visitId": "a0000001-0000-4000-8000-000000000001",
  "status": "COMPLETED",
  "code": "V-1001",
  "completedAt": "2026-09-25T17:50:00.123456Z"
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `visitId` | UUID (string) | Identificador unívoco de la visita finalizada |
| `status` | string | Nuevo estado: `"COMPLETED"` |
| `code` | string | Código legible de la visita (ej: `"V-1001"`) |
| `completedAt` | string (ISO-8601 UTC) | Marca temporal del servidor en la que se asentó la finalización |

**Errores:**

| Código HTTP | Código (`error`) | Condición | Cuerpo / Mensaje |
|---|---|---|---|
| 401 | `unauthorized` | Sin token o sesión inválida | Default Spring Security / `{"error":"unauthorized","message":"Sesión inválida."}` |
| 403 | `forbidden` | El usuario no tiene rol `OPERATOR` | `{"error":"forbidden","message":"Acceso denegado..."}` |
| 403 | `visit_not_assigned` | La visita existe pero no está asignada a este operador | `{"error":"visit_not_assigned","message":"La visita no está asignada a este operador."}` |
| 404 | `visit_not_found` | La visita no existe | `{"error":"visit_not_found","message":"No existe la visita indicada."}` |
| 409 | `visit_already_completed` | La visita ya se encontraba en estado `COMPLETED` | `{"error":"visit_already_completed","message":"La visita <código> ya está completada."}` |
| 409 | `visit_not_in_progress` | La visita no está en estado `IN_PROGRESS` (ej: `PENDING`, `ASSIGNED`, `CANCELLED`) | `{"error":"visit_not_in_progress","message":"Sólo se puede completar una visita en curso (estado ...)."}` |

---

## Modelo en TypeScript para el Cliente Móvil

```typescript
export interface CompleteVisitResponse {
  visitId: string;
  status: 'COMPLETED';
  code: string;
  completedAt: string;
}

export function completeVisit(visitId: string): Promise<CompleteVisitResponse> {
  return requestWithAuth<CompleteVisitResponse>(`/api/v1/visits/${encodeURIComponent(visitId)}/complete`, {
    method: 'POST',
  });
}
```

## Reglas para el Cliente Móvil

1. **Idempotencia:** Si al enviar `POST /api/v1/visits/{id}/complete` el backend devuelve `409` con `error: "visit_already_completed"`, la app móvil debe tratar la visita como exitosamente completada, actualizar su estado en SQLite local a `COMPLETED` y refrescar la agenda.
2. **Offline y sincronización:** La finalización en línea actualiza de inmediato el registro en SQLite (`agenda_visits.status = 'COMPLETED'`) y registra la traza pericial en `audit_traces` con evento `VISIT_COMPLETED`.
