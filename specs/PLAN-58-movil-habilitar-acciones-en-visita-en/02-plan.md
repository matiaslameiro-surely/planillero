# Plan técnico — PLAN-58

## Enfoque

Permitir al operador móvil llevar a cabo el ciclo completo de atención de una visita una vez que ésta fue iniciada (`IN_PROGRESS`):
1. En el backend, implementar el endpoint `POST /api/v1/visits/{id}/complete` que transiciona la visita de `IN_PROGRESS` a `COMPLETED`, protegido con autorización por rol (`OPERATOR`), verificación de asignación horizontal (`RouteSheetRepository` / `VisitAccessGuard`) y registro en la cadena de auditoría inmutable (`VISIT_COMPLETED`).
2. En el frontend, agregar los tres caminos de acción fundamentales en la tarjeta de visita `VisitCard`:
   - Botón directo para ingresar a captura y sellado pericial de evidencias (`/evidence/[visitId]`).
   - Botón para completar la planilla pericial (`/formulario`), usando la plantilla asignada a la visita o la plantilla estándar del sistema (`ACTA_CONSTATACION` v1) en caso de que la visita no tenga `formTemplateId`.
   - Botón para finalizar la visita con diálogo modal de confirmación, invocación a la API del backend, actualización del estado local en SQLite (`COMPLETED`) y registro de traza de auditoría pericial local.

## Archivos a tocar

### backend/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/main/java/ar/com/planillero/planning/Visit.java` | modificar | Agregar método de dominio `complete()` con validación de estado previo `IN_PROGRESS`. |
| `src/main/java/ar/com/planillero/planning/dto/CompleteVisitResponse.java` | crear | DTO de respuesta con el ID, nuevo estado `COMPLETED`, código y fecha de finalización. |
| `src/main/java/ar/com/planillero/planning/VisitCompleteService.java` | crear | Lógica transaccional de finalización, control de asignación, bloqueo pesimista y auditoría. |
| `src/main/java/ar/com/planillero/planning/VisitCompleteController.java` | crear | Endpoint REST `POST /api/v1/visits/{id}/complete` con `@PreAuthorize("hasRole('OPERATOR')")`. |
| `src/test/java/ar/com/planillero/planning/VisitCompleteIntegrationTest.java` | crear | Pruebas de integración del endpoint: éxito, conflicto si no está `IN_PROGRESS`, idempotencia si ya está `COMPLETED`, 403 y 404. |

### frontend/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/api/visits.ts` | modificar | Declarar función `completeVisit` y tipo `CompleteVisitResponse`. |
| `src/agenda/agendaRepository.ts` | modificar | Agregar función `markCompleted(db, visitId)` para actualizar `status = 'COMPLETED'` en SQLite. |
| `src/visit/completeVisit.ts` | crear | Orquestador de finalización: red, base local SQLite y traza de auditoría `VISIT_COMPLETED`. |
| `src/visit/completeVisit.test.ts` | crear | Pruebas unitarias de la lógica de finalización y manejo de errores/idempotencia. |
| `src/components/VisitCard.tsx` | modificar | Incorporar botones ergonómicos en `IN_PROGRESS`: «Evidencias / Firma», «Completar formulario» y «Finalizar visita». |
| `src/app/agenda.tsx` | modificar | Conectar callbacks de evidencias (`/evidence/[visitId]`), formulario (fallback `ACTA_CONSTATACION`) y confirmación de finalización. |
| `src/components/VisitCard.test.tsx` | modificar | Pruebas de renderizado y eventos de los nuevos botones de acción en `IN_PROGRESS`. |

## Decisiones técnicas

- **Transición estricta de estado en backend (`IN_PROGRESS` -> `COMPLETED`)** — Se descartó permitir finalizar desde cualquier estado (como `ASSIGNED`) porque la visita pericial requiere obligatoriamente haber registrado la presencia física inicial del operador en el domicilio.
- **Idempotencia mediante 409 con código específico (`visit_already_completed`)** — Se descartó responder error 500 genérico si se reintenta el pedido; de la misma forma que en `startVisit` (`visit_not_startable`), el móvil interpreta el 409 de visita ya completada como éxito diferido y actualiza la agenda.
- **Fallback a `ACTA_CONSTATACION` v1 en formulario** — Se descartó bloquear el formulario si `formTemplateId` viene nulo desde la API de asignación, porque en la práctica operativa actual muchas visitas no tienen template explícito asignado y requieren documentar el acta pericial general.
- **Confirmación antes de finalizar en móvil** — Se descartó finalizar con un solo toque; al ser una acción terminal irreversible para el operador de campo, se exige confirmación modal táctil (`Alert.alert`).

## Contrato de API (sólo si el alcance es `ambos`)

| Método | Ruta | Request | Response |
|---|---|---|---|
| `POST` | `/api/v1/visits/{id}/complete` | *(vacío)* | `200 OK` con `{ visitId, status: "COMPLETED", code, completedAt }` |

**Errores previstos:**
- `401 Unauthorized`: Sin sesión activa.
- `403 Forbidden`: Visita no asignada al operador (`visit_not_assigned`).
- `404 Not Found`: Visita inexistente (`visit_not_found`).
- `409 Conflict`: Visita ya completada (`visit_already_completed`) o no iniciada (`visit_not_in_progress`).

## Supuestos

- `Ninguno`: Todos los requerimientos, flujos existentes de evidencias, base SQLite local y contratos de backend fueron comprobados directamente en el código fuente.

## Cómo se prueba

1. **Backend:**
   - `mvnw -B test -Dtest=VisitCompleteIntegrationTest`: Valida el endpoint `POST /api/v1/visits/{id}/complete` con roles, estados, transiciones correctas y auditoría.
2. **Frontend:**
   - `npm test -- --watchAll=false`: Ejecuta suites de `VisitCard.test.tsx`, `completeVisit.test.ts`, `themeContrast.test.tsx` y `ergonomics.test.tsx`.
   - `npx tsc --noEmit` y `npm run lint`: Chequeo estricto de tipos TypeScript y linter.
