# Contrato de API — PLAN-49 (acceso por visita)

Esta tarea **no agrega endpoints ni cambia la forma de ningún request o response**. Agrega una regla
de acceso a endpoints que ya existen, y con ella un `403` y un resultado `FAILED` del sync que antes
no se daban. Para todo lo demás siguen valiendo los contratos originales:

| Endpoints | Contrato original |
|---|---|
| `POST`, `GET /api/v1/visits/{visitId}/evidences`, `GET …/evidences/{evidenceId}/file`, `POST`, `GET …/manifest`, `POST …/manifest/verify` | `specs/PLAN-10-task-08-registro-de-evidencias/03-contrato-api.md` |
| `POST /api/v1/visitas/{id}/formulario` | `specs/PLAN-7-task-07-backend-motor-de-validacion/03-contrato-api.md` |
| `GET /api/v1/visitas/{id}/formulario` | `specs/PLAN-13-renderizador-formularios/03-contrato-api.md` |
| `POST /api/v1/sync/batch` | `specs/PLAN-14-task-09-motor-de-sincronizacion-offline/03-contrato-api.md` |

## La regla

Se aplica **después** del control de rol (`@PreAuthorize`, sin cambios) y **antes** de validar el
cuerpo o escribir nada.

| Rol del usuario | Puede operar sobre la visita si… | Si no |
|---|---|---|
| `ADMINISTRATOR` | siempre | — |
| `SUPERVISOR` | la visita es de su jurisdicción | `403 outside_jurisdiction` |
| `OPERATOR` | tiene la visita en alguna hoja de ruta propia (cualquier fecha) | `403 visit_not_assigned` |

- Con más de un rol, vale el más amplio.
- Si la visita no existe, se responde `404 visit_not_found` antes de evaluar el acceso.

## Respuestas nuevas

### `403 Forbidden` — supervisor fuera de su jurisdicción

```json
{
  "error": "outside_jurisdiction",
  "message": "No tenés jurisdicción sobre las visitas u operadores de esa zona."
}
```

### `403 Forbidden` — operador sin la visita asignada

```json
{
  "error": "visit_not_assigned",
  "message": "La visita no está asignada a este operador."
}
```

Son los mismos códigos y mensajes que ya usan planificación (`POST /api/v1/visits/assign`,
`GET /api/v1/operators/{operatorId}/route-sheets`) e inicio de visita
(`POST /api/v1/visits/{id}/start`).

### `404 Not Found` — visita inexistente

```json
{
  "error": "visit_not_found",
  "message": "No existe la visita indicada."
}
```

Aparece ahora también en `POST` y `GET …/evidences`, `GET …/evidences/{evidenceId}/file`, `POST`,
`GET …/manifest` y `POST …/manifest/verify`, que antes no comprobaban la visita. PLAN-51 fija el
mismo código para esos endpoints.

### Por endpoint

| Método | Ruta | Roles | Respuestas nuevas |
|---|---|---|---|
| `POST` | `/api/v1/visits/{visitId}/evidences` | operador, supervisor, admin | `403 outside_jurisdiction`, `403 visit_not_assigned`, `404 visit_not_found` |
| `GET` | `/api/v1/visits/{visitId}/evidences` | operador, supervisor, admin | ídem |
| `GET` | `/api/v1/visits/{visitId}/evidences/{evidenceId}/file` | operador, supervisor, admin | ídem |
| `POST` | `/api/v1/visits/{visitId}/manifest` | operador, supervisor, admin | ídem |
| `GET` | `/api/v1/visits/{visitId}/manifest` | operador, supervisor, admin | ídem |
| `POST` | `/api/v1/visits/{visitId}/manifest/verify` | operador, supervisor, admin | ídem |
| `POST` | `/api/v1/visitas/{id}/formulario` | operador, supervisor, admin | `403 outside_jurisdiction`, `403 visit_not_assigned` |
| `GET` | `/api/v1/visitas/{id}/formulario` | supervisor, admin | `403 outside_jurisdiction` |

Una escritura rechazada no deja nada: ni evidencia, ni binario en el storage, ni manifiesto, ni
formulario.

## Sincronización (`POST /api/v1/sync/batch`)

La regla se evalúa **por operación**. Una operación sin acceso vuelve `FAILED` con el mismo código;
el lote responde `200` y las demás operaciones se aplican normalmente.

```json
{
  "results": [
    {
      "clientOperationId": "5b0c3f9e-7d1a-4c2b-9e8f-1a2b3c4d5e6f",
      "status": "APPLIED",
      "form": { "visitId": "…", "templateKey": "mantenimiento-general", "templateVersion": 1, "submittedAt": "…" },
      "error": null,
      "message": null
    },
    {
      "clientOperationId": "8c1d4a0f-2e3b-4d5c-8f9a-0b1c2d3e4f5a",
      "status": "FAILED",
      "form": null,
      "error": "visit_not_assigned",
      "message": "La visita no está asignada a este operador."
    }
  ]
}
```

Los códigos de `error` posibles en `FAILED` suman `outside_jurisdiction` y `visit_not_assigned` a
los del contrato de PLAN-14.

El control va **antes** de detectar operaciones repetidas: una operación sobre una visita sin acceso
vuelve `FAILED` aunque su `clientOperationId` ya se haya aplicado, y nunca como `DUPLICATE` con el
formulario de otro usuario.

## Impacto en los clientes

Ninguno obligatorio. En el uso normal ningún cliente pide una visita ajena. Si pasa:

- **App móvil:** la carga en línea recibe un `ApiError` con el `message` de arriba. El sync marca como
  rechazada la operación `FAILED`, igual que cualquier otro `FAILED`.
- **Backoffice:** el visor del expediente recibe un `403` en lugar de los datos.
