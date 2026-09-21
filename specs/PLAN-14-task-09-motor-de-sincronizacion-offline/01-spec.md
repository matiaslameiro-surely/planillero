# PLAN-14 — TASK-09: Motor de Sincronización Offline-First con Garantía de Idempotencia

## Contexto y problema

El operador carga el formulario de una visita en la calle, donde la conectividad es intermitente. Hoy
el móvil sólo sabe trabajar en línea: `startVisit` falla con `offline` y la carga del formulario
(`POST /api/v1/visitas/{id}/formulario`) no tiene ninguna red de contención. Si el operador está sin
señal, el trabajo se pierde o queda a la espera de que él se acuerde de reintentar.

El riesgo del reintento es el opuesto y es peor: estos formularios son parte de un expediente legal.
Un reintento que el servidor procesa dos veces deja **dos actas** para una misma visita, y una
duplicación en un expediente no se resuelve borrando una fila. La garantía que hace falta es
explícita: el mismo envío, mandado N veces, produce **un solo** registro y la **misma** respuesta.

El issue de Jira es detallado en el qué y deja abierto el cómo. Describe cinco frentes (backend,
móvil, web, base de datos y testing) más consideraciones de UX y seguridad. Dos de esos frentes ya
están parcialmente resueltos por tareas anteriores: la base local del móvil **ya está cifrada con
SQLCipher** (PLAN-9) y el catálogo de formularios y su validación **ya existen** (PLAN-7). Esta spec
se apoya en eso y no lo rehace.

## Alcance

**Repos que toca:** `backend`, `frontend` (móvil), `backoffice` (web)

- **backend** — endpoint de sincronización por lote con garantía de idempotencia, y migración de base.
- **frontend** — cola de sincronización local, worker de despacho, indicador de pendientes y freno al
  cerrar sesión.
- **backoffice** — indicador de sincronización diferida en la grilla de visitas.

## Criterios de aceptación

### Backend

1. Existe `POST /api/v1/sync/batch`, autenticado, con rol `OPERATOR`, `SUPERVISOR` o `ADMINISTRATOR`.
   Recibe una lista de operaciones y devuelve el resultado de cada una en el mismo orden.
   > El issue nombra el endpoint como `/api/v1/sincronizacion/lote`. Se usa la forma en inglés por la
   > convención de código del proyecto (ver Preguntas abiertas).
2. La petición **requiere** el header `Idempotency-Key` con un UUIDv4. Sin el header, o con un valor
   que no es UUIDv4, responde `400` con código `idempotency_key_required` o `idempotency_key_invalid`
   respectivamente, y **no** procesa ninguna operación del lote.
3. Un lote procesado con éxito guarda su respuesta. Un **segundo** envío con el mismo
   `Idempotency-Key` devuelve `200` con **exactamente el mismo cuerpo** que el primero y **no**
   escribe nada: la cantidad de formularios guardados no cambia.
4. Un envío con un `Idempotency-Key` ya usado pero con un **cuerpo distinto** responde `409` con
   código `idempotency_key_reused`. No se procesa: una clave identifica un envío, no un turno.
5. Cada operación del lote lleva su propio identificador de cliente (`clientOperationId`, UUIDv4).
   Una visita cuyo formulario ya fue cargado con ese identificador no se vuelve a escribir: la
   operación se resuelve como `duplicate` y la respuesta informa el resultado original.
6. Con **20 hilos concurrentes** enviando el mismo lote con el mismo `Idempotency-Key`, exactamente
   uno ejecuta el trabajo; el resto obtiene la respuesta cacheada o `409` de concurrencia, y al final
   hay **un solo** formulario guardado. Hay un test que lo demuestra.
7. Una operación inválida (visita inexistente, formulario que no cumple el schema) no aborta el lote:
   esa operación vuelve con su error y las demás se procesan. El estado de cada operación queda en la
   respuesta.
8. La migración crea `sync.idempotency_keys` (clave, huella del cuerpo, respuesta, usuario, fecha) y
   agrega a `visits.visits` la columna del identificador de operación con restricción `UNIQUE`, más
   la marca de sincronización diferida.
9. `GET /api/v1/visits` devuelve, por visita, si su formulario llegó de forma diferida
   (`syncedDeferred`) y cuándo se sincronizó.

### Frontend (móvil)

10. La base local tiene una tabla de cola de sincronización, creada por el mismo mecanismo de
    versión de esquema que ya usa la agenda, dentro del archivo cifrado existente.
11. Encolar una operación devuelve su `clientOperationId` y la deja `pending`. La cola sobrevive al
    cierre de la app: al reabrirla, las pendientes siguen ahí.
12. Un worker despacha la cola **automáticamente** al pasar de sin red a con red, sin que el operador
    toque nada. Mientras no hay red, no se hace ninguna petición.
13. Un despacho que falla por red deja la operación `pending` y **no** incrementa duplicados: el
    reintento reutiliza el mismo `clientOperationId` y el mismo `Idempotency-Key` de lote.
14. Un despacho que el backend rechaza por dato inválido (`400`/`404`) marca la operación como
    `failed` con su motivo, y no se reintenta indefinidamente.
15. Hay un indicador visible con el texto «Cola de sincronización: N actas pendientes», que muestra
    confirmación cuando la cola queda vacía y desaparece cuando no hay nada pendiente.
16. Cerrar sesión con operaciones pendientes muestra una advertencia con la cantidad y pide
    confirmación antes de continuar. Confirmar cierra la sesión igual; cancelar no cierra nada.

### Backoffice

17. La grilla de visitas de Planificación tiene una columna de sincronización que marca «Diferida» en
    las visitas cuyo formulario llegó por el endpoint de lote, con la fecha en el título accesible.
    Las demás no muestran nada.

## Fuera de alcance

- **Cifrado de la base local**: ya resuelto con SQLCipher en PLAN-9. Esta tarea usa la base existente.
- **La pantalla de carga del formulario en el móvil**: la está haciendo PLAN-13 (TASK-07 móvil). Acá
  se entrega la cola y su API; la pantalla que encola llega con esa tarea. Se incluye un disparador
  mínimo sólo para poder verificar el ciclo completo.
- **El tablero de supervisión y el mapa operativo**: son PLAN-12 (TASK-11).
- **Sincronización de evidencias y adjuntos binarios**: el lote transporta formularios, no archivos.
- **Resolución de conflictos por edición concurrente**: no hay edición concurrente de un formulario;
  la garantía de esta tarea es de no duplicación, no de merge.
- **Sincronización descendente** (traer cambios del servidor al móvil): la agenda ya tiene la suya.

## Preguntas abiertas

- [ ] `NO-BLOQUEANTE` — El issue nombra el endpoint `/api/v1/sincronizacion/lote` y la tabla
      `idempotency_keys`. La convención del proyecto (AGENTS.md → Convenciones) obliga a nombres en
      inglés, y todos los endpoints posteriores al esqueleto ya lo están (`/api/v1/visits`,
      `/api/v1/auth`). **Se resuelve por la convención**: `POST /api/v1/sync/batch`. La tabla sí se
      llama `idempotency_keys`, que ya era inglés. Se deja anotado por si el issue viene de un
      documento de arquitectura que fija los paths.
- [ ] `NO-BLOQUEANTE` — Qué operaciones admite el lote. Se decide **una sola en esta tarea**
      (`visit_form`, la carga del formulario de una visita), con el tipo declarado en cada operación
      para poder sumar otras sin romper el contrato.
- [ ] `NO-BLOQUEANTE` — Qué significa «sincronizada en modo diferido» para el backoffice. Se define
      como: **el formulario llegó por `POST /api/v1/sync/batch`** y no por la carga en línea. No se
      usa el desfasaje de reloj como criterio, porque ya existe `drift_seconds` para otra cosa y
      mezclarlos haría que un reloj mal puesto se vea como trabajo offline.
- [ ] `NO-BLOQUEANTE` — Cuántas veces se reintenta una operación antes de darla por perdida. Se define
      un tope de reintentos por operación con espera creciente; el valor exacto se fija en el plan.
