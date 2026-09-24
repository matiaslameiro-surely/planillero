# Contrato de API — PLAN-46

Emitido por `backend` (rama `PLAN-46-auditoria-identificar-las-visitas-por`). Lo consume `backoffice`.

## `GET /api/v1/audit/logs` — cambio compatible

Cada elemento de `content` suma un campo:

| Campo | Tipo | Descripción |
|---|---|---|
| `entityCode` | `string \| null` | Código de la visita (`V-1001`) cuando `entityType = "VISIT"`. `null` en otras entidades o si la visita no se encuentra |

```json
{ "entityType": "VISIT", "entityId": "a0000001-…", "entityCode": "V-1001", "…": "…" }
```

## `GET /api/v1/audit/verify?visitId=` — cambio compatible

`visitId` acepta **el UUID o el código** de la visita. Vacío o ausente: verifica la cadena completa.
La respuesta 200 no cambia.

| Caso | Status | Cuerpo |
|---|---|---|
| No corresponde a ninguna visita (p. ej. `66`, `V-9999`) | 404 | `{ "error": "visit_not_found", "message": "No existe una visita con ese ID o código." }` |

## Parámetros con formato inválido — todos los endpoints

Un parámetro que no se puede convertir al tipo esperado (p. ej. un UUID mal formado en la ruta)
responde:

| Status | Cuerpo |
|---|---|
| 400 | `{ "error": "invalid_parameter", "message": "El parámetro «<nombre>» tiene un formato inválido." }` |
