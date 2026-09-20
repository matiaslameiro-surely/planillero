# Plan técnico — PLAN-11

## Enfoque

Un aspecto de Spring (`@AuditLog` + `AuditAspect`) intercepta los métodos de servicio que ya mutan
una visita (`PlanningService.assign`, `VisitStartService.start`, `VisitFormService.submit`,
`EvidenceService.saveEvidence`, `ManifestService.createAndSignManifest`) y arma una fila de
`auditoria_logs` con lo que la request y la respuesta tienen: usuario autenticado (`Authentication`
del contexto de seguridad), IP (`RequestContextHolder`), argumentos/resultado serializados y
enmascarados, y un hash encadenado con el registro anterior. La tabla es append-only por un trigger
de PostgreSQL que rechaza `UPDATE`/`DELETE` con excepción, no sólo por convención de la aplicación.
El cálculo de SHA-256 reusa `CryptoService.calculateSha256(byte[])` (ya existe para evidencias y
manifiestos): no se reimplementa.

El backoffice suma una pantalla `ADMINISTRATOR`-only que lista esos eventos con filtros y dispara la
verificación de la cadena contra un endpoint dedicado. El móvil guarda localmente sus propios
eventos operativos (inicio de visita, evidencia capturada) en una tabla SQLite nueva, sin
transmitirlos todavía (ver "Fuera de alcance" en la spec): sólo se deja el dato listo para el futuro
motor de sincronización.

## Archivos a tocar

### backend/

| Archivo | Acción | Para qué |
|---|---|---|
| `pom.xml` | modificar | agregar `spring-boot-starter-aop` (no está en el proyecto) |
| `src/main/resources/db/migration/V11__audit_log_schema.sql` | crear | tabla `auditoria_logs` + trigger append-only |
| `audit/AuditLog.java` | crear | anotación `@AuditLog(eventType=...)` para marcar métodos auditables |
| `audit/AuditLogEntry.java` | crear | entidad JPA de la tabla `auditoria_logs` |
| `audit/AuditLogRepository.java` | crear | sólo `save`, `findAll` paginado con filtros y lectura de la última fila (para el hash previo) |
| `audit/AuditMasker.java` | crear | enmascara claves `password`/`token`/`secret`/`dni` (case-insensitive) en el JSON del delta antes de persistir |
| `audit/AuditChainService.java` | crear | arma la fila, calcula `hash_actual`, persiste con lock para serializar la cadena (ver Decisiones) |
| `audit/AuditAspect.java` | crear | `@Around` sobre `@AuditLog`: extrae usuario/IP/dispositivo, delega en `AuditChainService` |
| `audit/dto/AuditLogDto.java` | crear | forma de fila para el endpoint de consulta |
| `audit/dto/ChainVerificationResponse.java` | crear | resultado de la verificación (íntegra / rota + eslabón) |
| `audit/AuditController.java` | crear | `GET /api/v1/audit/logs` (paginado, filtros) y `GET /api/v1/audit/verify` (`ADMINISTRATOR`) |
| `planning/PlanningService.java` | modificar | anotar `assign(...)` con `@AuditLog` |
| `planning/VisitStartService.java` | modificar | anotar `start(...)` con `@AuditLog` |
| `visits/VisitFormService.java` | modificar | anotar `submit(...)` con `@AuditLog` |
| `evidence/service/EvidenceService.java` | modificar | anotar `saveEvidence(...)` con `@AuditLog` |
| `evidence/service/ManifestService.java` | modificar | anotar `createAndSignManifest(...)` con `@AuditLog` |
| `src/test/.../audit/AuditChainImmutabilityTest.java` | crear | Testcontainers: `UPDATE`/`DELETE` directo contra `auditoria_logs` falla |
| `src/test/.../audit/AuditAspectTest.java` | crear | invoca un método anotado, verifica fila + hash encadenado correcto |
| `src/test/.../audit/AuditMaskerTest.java` | crear | un campo `password`/`dni` no queda en texto plano |
| `src/test/.../audit/AuditControllerTest.java` | crear | `403` para no-`ADMINISTRATOR`, filtros, verificación con cadena rota simulada |

### frontend/ (móvil)

| Archivo | Acción | Para qué |
|---|---|---|
| `src/db/agendaSchema.ts` | modificar | paso de migración `version < 2`: tabla `visit_audit_traces` (ver Decisiones sobre por qué no un archivo de esquema aparte) |
| `src/audit/auditRepository.ts` | crear | `insertTrace(...)` / `listTraces(visitId)` sobre la tabla local |
| `src/visit/startVisit.ts` | modificar | registra una traza local al iniciar la visita |
| `src/app/evidence/[visitId].tsx` | modificar | registra una traza local al guardar cada evidencia |
| `src/audit/auditRepository.test.ts` | crear | inserta y lee trazas locales |

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/core/guards/administrator.guard.ts` | crear | sesión + rol `ADMINISTRATOR`, mismo patrón que `supervisor.guard.ts` |
| `src/app/core/services/audit.service.ts` | crear | `GET /audit/logs`, `GET /audit/verify` |
| `src/app/core/models/audit.model.ts` | crear | tipos de fila de auditoría y resultado de verificación |
| `src/app/pages/auditoria/auditoria.ts` / `.html` / `.scss` | crear | tabla filtrable + botón "Auditar Integridad de Visita" |
| `src/app/app.routes.ts` | modificar | ruta `/auditoria` con `administratorGuard` |
| `src/app/pages/home/home.html` | modificar | link a "Auditoría" visible sólo para `ADMINISTRATOR` |
| `src/app/pages/auditoria/__tests__/auditoria.test.ts` | crear | renderiza, filtra, dispara verificación |
| `src/app/core/services/__tests__/audit.service.test.ts` | crear | llamadas HTTP correctas |

> 30 archivos entre los tres repos: supera `limiteArchivosSinCheckpoint` (12) de `workspace.json`.
> El checkpoint de plan ya es obligatorio igual (está en `flujo.checkpoints`), así que esto no
> agrega un freno nuevo, pero confirma que corresponde esperar tu aprobación antes de implementar.

## Decisiones técnicas

- **Encadenar el hash a nivel de servicio (`AuditChainService`), no con un trigger de PostgreSQL
  que calcule el hash él mismo.** Se descartó calcularlo en la base porque el hash incluye el
  payload ya enmascarado y normalizado por Jackson desde Java; reproducir esa normalización en
  PL/pgSQL duplicaría lógica y sería más frágil que centralizarla en un solo lugar.
- **Serializar la escritura de la cadena con un lock pesimista sobre la última fila
  (`SELECT ... FOR UPDATE` acotado a la fila de mayor `created_at`), no con una cola en memoria.**
  Se descartó una cola/lock en memoria de la aplicación porque no sobrevive un reinicio ni protege
  contra dos instancias del backend corriendo a la vez (aunque hoy el proyecto corre una sola
  instancia, no hay garantía de que eso siga así). El lock a nivel de fila es correcto también en
  ese escenario.
- **Reusar `CryptoService.calculateSha256` en vez de escribir un segundo cálculo SHA-256.** Ya
  existe, ya está probado con evidencias y manifiestos, y el issue pide el mismo algoritmo.
- **El paso de migración local del móvil va en `agendaSchema.ts` (subiendo a versión 2), no en un
  archivo de esquema separado.** `PRAGMA user_version` es un único contador por archivo SQLite: dos
  funciones de migración independientes escribiéndolo en paralelo se pisarían. El nombre del
  archivo no cambia porque no es una tarea de renombrado, sólo se le agrega un paso más al mismo
  mecanismo de versionado que ya existe.
- **El módulo del backoffice queda restringido a `ADMINISTRATOR` (no se crea rol `AUDITOR`).**
  Ya lo dice la spec como pregunta no bloqueante resuelta por defecto: el sistema no tiene ese rol
  hoy y crearlo es un cambio de alcance mayor (migración de roles, seed de datos) que no pidió el
  issue explícitamente.
- **La traza local del móvil no se transmite en esta tarea.** El batch de sincronización con
  `Idempotency-Key` es `TASK-09` / `PLAN-14`, sin implementar. Guardar el dato con la forma correcta
  ahora evita retrabajo cuando esa tarea exista, sin inventar un mecanismo de envío que se va a
  descartar.

## Contrato de API

| Método | Ruta | Request | Response |
|---|---|---|---|
| `GET` | `/api/v1/audit/logs` | query params `eventType?`, `username?`, `from?`, `to?`, `page`, `size` | página de `AuditLogDto` (id, eventType, username, ip, entityType, entityId, createdAt, payload enmascarado) |
| `GET` | `/api/v1/audit/verify` | query param opcional `visitId` (si falta, verifica toda la cadena) | `ChainVerificationResponse` (`intacta: boolean`, `primerEslabonRotoId?: UUID`, `motivo?: string`) |

Los dos exigen rol `ADMINISTRATOR` (`403` para cualquier otro). El detalle definitivo (nombres
exactos de campos, formato de paginación) se fija en `03-contrato-api.md` en la fase 3, antes de
que el backoffice empiece a consumirlo.

## Supuestos

- El backend corre como una sola instancia en este entorno (dev/CI), pero el lock pesimista de
  `AuditChainService` está pensado para seguir siendo correcto si eso cambia. `RIESGO` si en algún
  punto se decide loguear auditoría desde más de un proceso escribiendo a la vez sin pasar por esta
  misma tabla y lock: dos productores independientes podrían romper el orden de la cadena. No es el
  caso hoy.
- Los cinco métodos elegidos (`assign`, `start`, `submit`, `saveEvidence`,
  `createAndSignManifest`) son las mutaciones de negocio que hoy existen sobre una visita. Si en el
  futuro aparece otra (por ejemplo, cuando se implemente `TASK-07` móvil o `TASK-09`), se le agrega
  la anotación en esa tarea; no hace falta tocar el aspecto.
- El rol `ADMINISTRATOR` ya alcanza el nivel de acceso que el backlog describe como
  "Administrador/Auditor": no se verificó con nadie del equipo, es la lectura más simple del issue
  dado que no existe un rol separado.

## Cómo se prueba

- Backend: `AuditChainImmutabilityTest` (Testcontainers) intenta `UPDATE`/`DELETE` directo y
  espera que la base lo rechace — cubre el criterio 3. `AuditAspectTest` invoca `VisitStartService
  .start(...)` con un usuario autenticado de prueba y verifica la fila resultante, su
  `hash_previo`/`hash_actual` y que un segundo evento encadena contra el primero — cubre 1 y 2.
  `AuditMaskerTest` cubre 7. `AuditControllerTest` cubre 4, 5 y el `403` para roles no autorizados.
- Backoffice: `auditoria.test.ts` monta el componente con un backend simulado, filtra, y verifica
  que el botón de integridad muestra el resultado — cubre 6.
- Frontend móvil: `auditRepository.test.ts` abre una base en memoria, inserta una traza al simular
  el inicio de una visita y la relee — cubre 8.
- Gates automáticos de los tres repos (`node .agents/scripts/verificar.mjs --tarea PLAN-11`).
