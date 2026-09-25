# PLAN-58 — Móvil: habilitar acciones en visita En Curso (botón a Evidencias, formulario y finalización)

## Contexto y problema

Al iniciar una visita asignada desde la app móvil (`src/components/VisitCard.tsx`), su estado pasa a `IN_PROGRESS` («En curso») registrando las coordenadas GPS y las marcas temporales.

Sin embargo, una vez en curso, la tarjeta de la visita en la hoja de ruta quedaba en un callejón sin salida funcional:
1. El botón «Completar formulario» sólo aparecía si `visit.formTemplateId` estaba definido. Cuando las visitas se planifican o asignan sin un template explícito, el operador no puede acceder a completar la planilla pericial.
2. No existía ningún enlace o botón en la tarjeta para acceder a la pantalla de captura de evidencias periciales (fotografías y firma digital ológrafa en `/evidence/[visitId]`), a pesar de estar ya programada en la aplicación móvil.
3. No existía ningún mecanismo para marcar la visita como finalizada o completada una vez concluida la labor en el domicilio, y el backend no exponía un endpoint para transicionar la visita de `IN_PROGRESS` a `COMPLETED`.

## Alcance

**Repos que toca:** `backend`, `frontend`

- `backend`: Exponer el endpoint `POST /api/v1/visits/{id}/complete` para que el operador asignado pueda dar por concluida la visita `IN_PROGRESS`, actualizando la entidad `Visit` a `COMPLETED` y registrando la auditoría correspondiente. Emitir `03-contrato-api.md`.
- `frontend`: En la app móvil (`VisitCard.tsx`, `agenda.tsx`, `agendaRepository.ts`, `api/visits.ts`), agregar los botones de acción para visitas `IN_PROGRESS`: «Evidencias / Firma», «Completar formulario» (con fallback a plantilla por defecto si no tiene una asignada) y «Finalizar visita» (con diálogo de confirmación y sincronización inmediata de estado local y remoto).

## Criterios de aceptación

1. **Acceso directo a Evidencias:** En toda tarjeta de visita con estado `IN_PROGRESS`, se muestra un botón destacado «Evidencias / Firma» que navega a la ruta `/evidence/${visit.visitId}`.
2. **Acceso a Formulario con fallback:** En estado `IN_PROGRESS`, se muestra el botón «Completar formulario». Si la visita cuenta con `formTemplateId` y `formTemplateVersion`, se invocan con dichos parámetros; si no tiene plantilla asignada, se utiliza por defecto la clave `ACTA_CONSTATACION` (versión 1).
3. **Endpoint de finalización en Backend:**
   - `POST /api/v1/visits/{id}/complete` accesible para usuarios con rol `OPERATOR`.
   - Valida pertenencia de la visita al operador autenticado vía `VisitAccessGuard`.
   - Si la visita está en `IN_PROGRESS`, pasa su estado a `COMPLETED` y retorna `200 OK` con el resumen de la visita (`id`, `status: COMPLETED`, `code`).
   - Si la visita ya está `COMPLETED`, responde `409 Conflict` con código de error `visit_already_completed` (idempotencia para reintentos del móvil).
   - Si la visita no está en `IN_PROGRESS` (por ejemplo `PENDING` o `ASSIGNED`), responde `409 Conflict` con código `visit_not_in_progress`.
   - Registra auditoría de la finalización de la visita.
4. **Acción de Finalizar Visita en Móvil:**
   - En estado `IN_PROGRESS`, se muestra el botón «Finalizar visita».
   - Al presionarlo, solicita confirmación previa al usuario mediante alerta modal para evitar cierres accidentales.
   - Al confirmar, efectúa la llamada al backend `completeVisit(visitId)`.
   - Actualiza el estado en SQLite local (`agenda_visits.status = 'COMPLETED'`) para reflejarlo de inmediato en la hoja de ruta y recalcular las visitas pendientes en `DeviceStatusBar`.
   - Registra traza local de auditoría `VISIT_COMPLETED` en `auditRepository`.
5. **Estado Completada y Ergonomía:**
   - Una vez `COMPLETED`, la tarjeta muestra el badge verde «Completada» y oculta los botones de inicio y finalización (pudiendo mantener acceso de consulta si aplica).
   - Todos los botones agregados cumplen el estándar ergonómico táctil (altura mínima de 48 dp / `MIN_TOUCH_TARGET`), soporte de tema claro/oscuro y etiquetas de accesibilidad semánticas (`accessibilityRole`, `accessibilityLabel`).

## Fuera de alcance

- Modificar el flujo interno de captura pericial y sellado WORM en `/evidence/[visitId]`.
- Modificar el renderizador dinámico de formularios o el esquema JSON de las plantillas.
- Reasignación de visitas desde el backoffice (las visitas completadas ya no son reasignables según la regla de negocio existente).

## Preguntas abiertas

- [ ] `NO-BLOQUEANTE` Plantilla por defecto: Se utiliza `ACTA_CONSTATACION` v1 como plantilla estándar cuando `formTemplateId` sea nulo en la visita.
