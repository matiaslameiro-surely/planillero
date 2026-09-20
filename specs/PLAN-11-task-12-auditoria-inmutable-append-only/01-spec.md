# PLAN-11 — TASK-12: Auditoría Inmutable Append-Only y Verificación de Cadena de Custodia

## Contexto y problema

El sistema necesita un registro inmutable de las acciones que se ejecutan sobre las visitas
(creación, inicio, carga de formulario, evidencias, manifiesto), para sostener trazabilidad legal
ante una eventual disputa sobre lo actuado en una visita de supervisión. Hoy no existe ningún
mecanismo de auditoría: ni interceptor que capture las mutaciones, ni tabla append-only, ni forma
de verificar si un registro fue alterado.

El issue de Jira es el texto íntegro del backlog (`docs/BACKLOG_PLANILLERO.md`, TAREA 12): pide un
interceptor AOP `@AuditLog`, encadenamiento criptográfico SHA-256 con `hash_previo`, una tabla
append-only con reglas que rechacen `UPDATE`/`DELETE`, un módulo de consulta en el backoffice con
botón "Auditar Integridad de Visita", y registro local de trazas en el móvil.

## Alcance

**Repos que toca:** `backend`, `backoffice`, `frontend` (móvil)

- **Backend:** interceptor AOP, tabla `auditoria_logs`, encadenamiento de hashes, endpoints de
  consulta y de verificación de integridad.
- **Backoffice:** módulo de consulta de auditoría (sólo `ADMINISTRATOR`) con filtros y el botón de
  verificación de integridad.
- **Frontend móvil:** registro **local** (SQLite) de eventos operativos del operador durante la
  visita. Ver "Fuera de alcance": la transmisión de esas trazas al backend depende de TASK-09
  (motor de sincronización, `PLAN-14`), que todavía no está implementada.

## Criterios de aceptación

1. Un interceptor AOP (`@AuditLog`) captura, para cada mutación relevante sobre una visita
   (creación/asignación, inicio, guardado de formulario, subida de evidencia, generación del
   manifiesto), el método invocado, el usuario autenticado, la IP de origen, el dispositivo (si
   viene en la request), la entidad afectada y el delta de datos en JSONB.
2. Cada fila de `auditoria_logs` guarda `hash_previo` y
   `hash_actual = SHA256(id + timestamp + payload + hash_previo)`. El primer registro de la cadena
   usa un `hash_previo` constante y documentado (64 ceros).
3. La tabla `auditoria_logs` sólo permite `INSERT` y `SELECT`: un test que intenta `UPDATE` o
   `DELETE` directamente contra la base recibe un error de la base de datos (regla/trigger de
   PostgreSQL, no sólo una restricción a nivel de aplicación).
4. Endpoint `GET` paginado para consultar la auditoría, filtrable por tipo de evento, usuario y
   rango de fechas, accesible únicamente con rol `ADMINISTRATOR` (`403` para cualquier otro rol).
5. Endpoint que recorre la cadena de hashes (de una visita puntual, o completa) y devuelve si está
   íntegra o en qué eslabón se rompió, incluyendo el motivo (`hash_actual` no coincide con el
   recalculado).
6. En el backoffice, un módulo "Auditoría" (ruta protegida por `ADMINISTRATOR`) con tabla
   filtrable de eventos y un botón "Auditar Integridad de Visita" que llama al endpoint del punto 5
   y muestra el resultado (íntegra / rota, y dónde).
7. Antes de persistir el payload, se enmascaran campos sensibles conocidos (contraseñas, tokens,
   DNI completo): un test verifica que un evento que originalmente contenía uno de esos campos no
   lo guarda en texto plano.
8. En el móvil, cada evento operativo que hoy tiene pantalla propia durante una visita (inicio de
   visita, evidencia capturada) queda persistido en una tabla local, con la forma de dato lista
   para viajar en el batch de sincronización cuando exista TASK-09. El evento de avance de
   formulario queda **fuera de esta tarea**: no hay pantalla de formulario en el móvil todavía (ver
   "Fuera de alcance").

## Fuera de alcance

- Transmisión real de las trazas móviles al backend: depende del motor de sincronización de
  TASK-09 (`PLAN-14`), que no está implementado todavía. Esta tarea deja el esquema local listo,
  no el envío.
- Traza local del evento "avance de formulario": depende de la pantalla de formulario dinámico del
  móvil, que es TASK-07 (Móvil) / `PLAN-13`, no implementada todavía. `auditRepository.ts` queda
  genérico (acepta cualquier `eventType`) para que esa tarea sólo tenga que agregar el llamado,
  sin tocar el repositorio.
- Un rol `AUDITOR` separado de `ADMINISTRATOR`: el sistema hoy sólo tiene `OPERATOR`, `SUPERVISOR`
  y `ADMINISTRATOR` (ver pregunta abierta).
- Alertas en tiempo real ante ruptura de cadena (WebSockets/RabbitMQ): es `TASK-10`, post-MVP.
- Auditoría de operaciones de sólo lectura: se audita mutación, no consulta.
- Tooltips contextuales y códigos de color semánticos detallados (Heurísticas UX del backlog): se
  resuelven con un criterio de UI razonable en el plan, no está definido pixel a pixel acá.

## Preguntas abiertas

- [ ] `NO-BLOQUEANTE` — El backlog menciona "Administrador/Auditor" pero el sistema no tiene un rol
  `AUDITOR`. Por defecto, el módulo queda restringido a `ADMINISTRATOR` (el único rol existente con
  ese nivel de acceso). Si hace falta un rol separado, es un ajuste de alcance para una tarea
  aparte.
- [ ] `NO-BLOQUEANTE` — El backlog no fija la lista exacta de operaciones auditadas. Propongo:
  creación/asignación de visita, inicio de visita, guardado de formulario, subida de evidencia,
  generación de manifiesto (son las mutaciones de negocio que ya existen sobre `Visit`). Se puede
  ampliar después sin romper el diseño del interceptor.
- [ ] `NO-BLOQUEANTE` — Enmascaramiento: por defecto se enmascara cualquier campo cuyo nombre
  contenga `password`, `token`, `secret` o `dni` (case-insensitive). Si hay otros campos sensibles
  específicos del dominio, se suman en el plan.
