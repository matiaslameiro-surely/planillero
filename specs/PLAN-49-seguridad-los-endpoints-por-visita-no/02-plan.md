# Plan técnico — PLAN-49

## Enfoque

Se crea **un solo componente**, `VisitAccessGuard` (paquete `planning`), con un único método
`requireAccess(visitId, username)`. El método busca al usuario (`401 unauthorized` si la sesión no
corresponde a nadie), busca la visita (`404 visit_not_found`), aplica la regla de la spec y
devuelve la `Visit`. Para la asignación reusa `RouteSheetRepository.existsByOperatorIdAndVisitId`,
el mismo método que ya usa `VisitStartService`, y los códigos y mensajes de `403` son los de
planificación.

Lo llaman los **services**, no los controladores, siguiendo el patrón del repo: «el
`@PreAuthorize` asegura el rol; el service asegura la zona». Cada método alcanzado recibe
`String username` como último parámetro, igual que `PlanningService` y `VisitStartService`, y los
controladores le pasan `authentication.getName()`. La llamada va **primera** en cada método, antes
de validar el cuerpo y antes de cualquier escritura. Así una operación rechazada no llega al storage
WORM ni a la base (criterio 4).

El sync es el único caso distinto. `SyncService.apply` llama a la guardia **antes** de la
detección de operación repetida (`resolveIfAlreadyApplied`), con el `username` que `process` ya
recibe. El `ApiException` que tira la guardia cae en el `catch (ApiException)` que ya existe y se
convierte en `FAILED` con el código. El lote no falla, porque así está hecho hoy.

## Archivos a tocar

### backend/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/main/java/ar/com/planillero/planning/VisitAccessGuard.java` | crear | La regla de acceso por visita, en un solo lugar |
| `src/main/java/ar/com/planillero/evidence/controller/EvidenceController.java` | modificar | Pasar el `username` a los services en los seis endpoints |
| `src/main/java/ar/com/planillero/evidence/service/EvidenceService.java` | modificar | Guardia en `saveEvidence`, `getEvidencesByVisit` y `getEvidenceEntity`. `loadEvidenceResource` recibe la `Evidence` ya autorizada |
| `src/main/java/ar/com/planillero/evidence/service/ManifestService.java` | modificar | Guardia en `createAndSignManifest`, `getLatestManifest` y `verifyManifest` |
| `src/main/java/ar/com/planillero/visits/VisitFormController.java` | modificar | Pasar el `username` en `POST` y `GET .../formulario` |
| `src/main/java/ar/com/planillero/visits/VisitFormService.java` | modificar | Guardia en `submit` y `getFormDetail`. Esta última reusa la `Visit` que devuelve la guardia |
| `src/main/java/ar/com/planillero/sync/SyncService.java` | modificar | Guardia por operación, antes de la detección de repetidas |
| `security-log.md` | modificar | Riesgo 5: control de acceso horizontal (OWASP A01) y dónde se aplica |
| `src/test/java/ar/com/planillero/VisitFixtures.java` | crear | Crear una visita en una zona y asignarla a un operador por JDBC, compartido entre tests |
| `src/test/java/ar/com/planillero/security/VisitAccessIntegrationTest.java` | crear | La matriz de la spec: cada endpoint × (zona ajena, no asignada, legítimo por rol), más «no deja rastro» y el lote mixto de sync |
| `src/test/java/ar/com/planillero/evidence/EvidenceIntegrationTest.java` | modificar | Hoy usa `UUID.randomUUID()` como visita: pasa a una visita real asignada a `operador.demo` |
| `src/test/java/ar/com/planillero/visits/VisitFormIntegrationTest.java` | modificar | Asignar a `operador.demo` las visitas que crea |
| `src/test/java/ar/com/planillero/sync/SyncBatchIntegrationTest.java` | modificar | Ídem |
| `src/test/java/ar/com/planillero/sync/SyncConcurrencyIntegrationTest.java` | modificar | Ídem |
| `src/test/java/ar/com/planillero/sync/SyncAbandonedKeyIntegrationTest.java` | modificar | Ídem |

Son 15 archivos en el backend. En el harness van además `03-contrato-api.md` de esta tarea y una nota
en los contratos de PLAN-7, PLAN-10, PLAN-13 y PLAN-14.

## Decisiones técnicas

- **Una guardia compartida en `planning`, invocada desde los services.** Se descartó repetir el
  chequeo en cada service, porque son tres paquetes y la regla se desalinearía. También se descartó
  un `@PreAuthorize("@visitAccess.can(#visitId, authentication)")` en los controladores: el `403`
  saldría del `RestAccessDeniedHandler` con un código genérico en vez de `outside_jurisdiction` o
  `visit_not_assigned`, y en el sync no sirve porque la visita viaja dentro del cuerpo, operación
  por operación. Va en `planning` porque ahí viven `Visit` y `RouteSheetRepository`.
- **El `username` viaja como parámetro explícito.** Se descartó leerlo del `SecurityContextHolder`
  dentro de la guardia, por dos motivos: `SyncConcurrencyIntegrationTest` llama a
  `syncService.process(…, "operador.demo")` sin contexto de seguridad, y el repo ya pasa el
  `username` explícito en `PlanningService` y `VisitStartService`. Como consecuencia, el payload de
  auditoría de `submit`, `saveEvidence` y `createAndSignManifest` suma el `username` como último
  argumento, igual que ya pasa con `VisitStartService.start`. Ningún test depende de la forma de
  `args`.
- **El sync valida en `SyncService` y no en `VisitFormService.submitDeferred`.** La guardia tiene que
  correr antes del camino rápido de repetidas, que está en `SyncService`. Agregarla también en
  `submitDeferred` duplicaría las consultas y obligaría a tocar el payload armado a mano de
  `auditDeferred` (PLAN-22). `submitDeferred` tiene un solo llamador, así que su javadoc va a decir que
  el acceso lo valida quien lo llama.
- **El administrador pasa por rol, no por la jurisdicción `GLOBAL`.** Es la decisión de la spec. Se
  descartó comparar con el string `GLOBAL`, porque un administrador cargado sin ese valor quedaría
  bloqueado en silencio.
- **`loadEvidenceResource` recibe la `Evidence` ya autorizada.** Se descartó que siga resolviéndola
  por `(visitId, evidenceId)`, porque obligaría a pasar la guardia dos veces por request: el
  controlador ya pide la entidad con `getEvidenceEntity` para armar los headers.
- **No se tocan `PlanningService` ni `VisitStartService`** para que usen la guardia. Tienen reglas
  propias (el supervisor contra la zona del operador; el inicio sólo para operadores) y moverlos
  agranda el diff sin cerrar ningún hueco.

## Supuestos

- `ApiException.forbidden(code, message)` ya produce `403` con `{"error": code, "message": …}`, como
  usa planificación. Verificado en `PlanningService`.
- `User.getRoles()` se puede recorrer dentro de la transacción de solo lectura de la guardia. La
  guardia lleva `@Transactional(readOnly = true)` y se une a la del service cuando la hay. Desde
  `SyncService`, que no es transaccional, abre la suya propia.
- PLAN-51 (PR #16) toca `EvidenceService`, `ManifestService` y `EvidenceIntegrationTest`. Esta rama
  sale de `main` sin PLAN-51, y quien mergee segundo resuelve el conflicto. No es `RIESGO` porque
  las dos tareas convergen en el mismo comportamiento (`404 visit_not_found`) y no se contradicen.
- Ningún test de otra clase (`AuditIntegrationTest`, `SupervisionIntegrationTest`…) llama a estos
  endpoints. Verificado con `grep`: sólo lo hacen las cinco clases de la tabla.

## Cómo se prueba

- `VisitAccessIntegrationTest` cubre los criterios 1 a 6 contra el seed real: `operador.demo` y
  `supervisor.demo` de `ZONA_NORTE`, `admin.demo` con `GLOBAL`, y `V-2001` de `ZONA_SUR`. Suma una
  visita del norte asignada y otra sin asignar, creadas por fixture. Los casos «no deja rastro»
  cuentan filas de `evidences` y `visit_manifests`, miran `responses_json` y revisan el storage
  local.
- Las cinco clases ajustadas siguen en verde con visitas asignadas, y eso cubre el criterio 5 en
  los flujos que ya estaban probados.
- Gates: `node .agents/scripts/verificar.mjs --tarea PLAN-49` (`compilar` y `tests`).
- A mano, con el backend levantado: el `curl` del issue devuelve `403 visit_not_assigned`.
