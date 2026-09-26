# Plan técnico — PLAN-61

## Enfoque

`VisitStatus` recibe el nombre en español de cada estado, como un campo del enum con un getter
`label()`:

| Estado | `label()` |
|---|---|
| `PENDING` | pendiente |
| `ASSIGNED` | asignada |
| `IN_PROGRESS` | en curso |
| `COMPLETED` | completada |
| `CANCELLED` | cancelada |

Los tres mensajes pasan de `visit.getStatus().name().toLowerCase()` a `visit.getStatus().label()`.
Los códigos de error y los status HTTP no se tocan.

El JSON de la API no cambia. Jackson serializa los enums por `name()`, y JPA los guarda con
`@Enumerated(EnumType.STRING)`, que también usa `name()`: un campo más en el enum no afecta a
ninguno de los dos.

## Archivos a tocar

### backend/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/main/java/ar/com/planillero/planning/VisitStatus.java` | modificar | Nombre en español de cada estado (`label()`) |
| `src/main/java/ar/com/planillero/planning/PlanningService.java` | modificar | `visit_not_assignable` con el estado en español |
| `src/main/java/ar/com/planillero/planning/VisitStartService.java` | modificar | `visit_not_startable` con el estado en español |
| `src/main/java/ar/com/planillero/planning/VisitCompleteService.java` | modificar | `visit_not_in_progress` con el estado en español |
| `src/test/java/ar/com/planillero/planning/VisitStatusTest.java` | crear | Todo estado tiene nombre, y los nombres son los esperados |
| `src/test/java/ar/com/planillero/planning/PlanningIntegrationTest.java` | modificar | `$.message` en español al asignar una visita completada |
| `src/test/java/ar/com/planillero/planning/VisitStartIntegrationTest.java` | modificar | `$.message` en español al reasignar una iniciada y al iniciar dos veces |
| `src/test/java/ar/com/planillero/planning/VisitCompleteIntegrationTest.java` | modificar | `$.message` en español al completar una visita asignada |

## Decisiones técnicas

- **El nombre en español vive en el enum.** Se descartó un `switch` o un `Map` en cada servicio,
  porque serían tres copias y un estado nuevo quedaría sin traducir en alguna. Con un campo que exige
  el constructor, no se puede agregar un estado sin su nombre: no compila.
- **`label()` y no `toString()`.** Se descartó sobrescribir `toString()`, porque se usa en logs y en
  depuración, donde conviene ver el nombre real del enum.
- **Sumar iniciar y completar.** Se descartó limitarse a la asignación: es el mismo defecto con el
  mismo arreglo, y dejarlo haría que el operador siga viendo `assigned` o `in_progress` en la app.
  Queda como pregunta no bloqueante en la spec.

## Supuestos

- Ningún cliente ni test depende del texto actual de esos tres mensajes. Verificado con `grep` en
  `frontend/src` y `backoffice/src`: sólo se usa el código `error`.
- Las visitas de los datos de prueba tienen código (`V-…`). Si algún test no conoce el código de
  antemano, el test verifica el mensaje con `containsString` sobre la parte del estado.

Ninguno es `RIESGO`.

## Cómo se prueba

- `VisitStatusTest` (unitario): los cinco nombres esperados, y ninguno vacío (criterios 3 y 5).
- Tests de integración (MockMvc), verificando `$.error` y `$.message`:
  - asignar una visita completada → «… no se puede asignar (estado completada).» (criterios 1 y 4)
  - reasignar una visita iniciada → «… (estado en curso).» (criterio 1)
  - iniciar dos veces → «… no se puede iniciar (estado en curso).» (criterio 2)
  - completar una visita asignada → «… (estado asignada).» (criterio 2)
- `node .agents/scripts/verificar.mjs --tarea PLAN-61` (criterio 7).
