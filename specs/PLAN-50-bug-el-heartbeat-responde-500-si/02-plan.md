# Plan técnico — PLAN-50

## Enfoque

La validación va en la entrada, no en la base. Se agrega `@Pattern(regexp = "ONLINE|OFFLINE|UNKNOWN")` a
`HeartbeatRequest.networkStatus`. El controller ya recibe el cuerpo con `@Valid`, así que un valor
inválido corta en `MethodArgumentNotValidException`, que `ApiExceptionHandler.handleValidation` ya traduce
al `400 {"error":"invalid_request","message":"networkStatus: …"}` de siempre. El servicio no se ejecuta,
así que no se toca el turno ni la base.

`@Pattern` considera válido el `null`, así que el caso ausente sigue igual que hoy sin tocar
`SupervisionService` (criterio 4).

## Archivos a tocar

### backend/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/main/java/ar/com/planillero/supervision/dto/HeartbeatRequest.java` | modificar | `@Pattern` con los tres valores y mensaje en español |
| `src/test/java/ar/com/planillero/supervision/SupervisionIntegrationTest.java` | modificar | Tests del valor inválido (`WIFI`, `online`, `""`) y de los válidos y el ausente, leyendo el turno con `OperatorShiftRepository` |

### specs/

| Archivo | Acción | Para qué |
|---|---|---|
| `specs/PLAN-50-…/03-contrato-api.md` | crear | El endpoint `POST /heartbeat` con los valores admitidos de `networkStatus` y el `400` por valor inválido |

## Decisiones técnicas

- **`@Pattern` sobre el `String`, y no un enum Java en el DTO.** Si el campo fuera un enum, un valor
  desconocido fallaría en Jackson (`HttpMessageNotReadableException`) antes de llegar a Bean Validation.
  `ApiExceptionHandler` no maneja esa excepción, así que la respuesta sería el `400` por defecto de
  Spring, con otro cuerpo, en vez del `{"error","message"}` que piden el issue y los clientes. Con
  `@Pattern`, el mensaje además nombra el campo.
- **Distinguir mayúsculas y minúsculas: `"online"` da `400`.** Se descartó aceptar minúsculas y
  normalizarlas: el `CHECK` de la base distingue mayúsculas, la app ya manda los valores en mayúsculas y
  aceptar variantes agrega un contrato que nadie pidió.
- **No se toca `SupervisionService` ni `OperatorShift`.** Se descartó mover la validación al servicio
  (por ejemplo, un `IllegalArgumentException` en `setNetworkStatus`): para ese momento el turno ya se
  creó o se cargó dentro de la transacción. La validación declarativa en el DTO corta antes y es
  consistente con `batteryLevel`, que ya se valida así.
- **El contrato va en `03-contrato-api.md` de esta tarea, sin editar el de PLAN-12.** Los valores ya
  están listados allí; lo nuevo es el `400`. Se descartó reescribir el artefacto de PLAN-12 porque es el
  registro de otra tarea cerrada, y su tabla de errores ya documenta un cuerpo (`{"code":…}`) que no
  coincide con el real. Se anota como fuera de alcance en la spec.

## Supuestos

- La validación del `@RequestBody` corre antes que el servicio, por el `@Valid` del
  `SupervisionController.recordHeartbeat`, que ya está en el código. Si no fuera así, el test del
  criterio 1 lo detecta.
- Los tests de integración comparten el contenedor y los datos semilla: los nuevos tests fijan un valor
  conocido en el turno de `operador.demo` antes de comprobar que no cambió, en lugar de asumir el valor
  que dejó otro test.

## Cómo se prueba

- `SupervisionIntegrationTest`:
  - `WIFI`, `online` y `""` → `400`, `error = invalid_request`, `message` empieza con `networkStatus`.
    El `networkStatus` y el `lastHeartbeatAt` del turno no cambian (criterios 1 y 2).
  - `ONLINE`, `OFFLINE` y `UNKNOWN` → `200`, y el turno queda con ese valor (criterio 3).
  - Con `OFFLINE` guardado, un latido sin `networkStatus` → `200` y el turno sigue en `OFFLINE`
    (criterio 4).
- Gates: `node .agents/scripts/verificar.mjs --tarea PLAN-50` (compilar y toda la suite).
