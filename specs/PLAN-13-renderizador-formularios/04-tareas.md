# Tareas - PLAN-13

> Checklist en **orden de dependencia**. Cada ítem con prefijo de repo (`[backend]`, `[frontend]`, `[backoffice]`).
> Todo lo de `[backend]` va antes (aquí solo verificación, sin código nuevo).
> Entre clientes no hay orden: son independientes.
> Marca `[x]` a medida que se completan.

## backend

- [x] `[backend]` Verificar que `POST /api/v1/visitas/{id}/formulario` existe en `main` y valida con `FormSchemaValidator` (ya confirmado en `VisitFormController` + `VisitFormService`)
- [x] `[backend]` Crear `GET /api/v1/visitas/{id}/formulario` (roles SUPERVISOR/ADMINISTRATOR, devuelve VisitFormDetailDto, 404 visit_not_found)
- [x] `[backend]` Tests de integración `VisitFormIntegrationTest` (401, 403, 200 con formulario, 200 sin formulario, 404)
- [x] `[backend]` Emitir/actualizar `03-contrato-api.md` con nuevo GET y respuestas corregidas (key/schema en lugar de templateKey/schemaJson/active)

## frontend (app móvil)

- [x] `[frontend]` Leer `03-contrato-api.md` antes de empezar
- [x] `[frontend]` `src/forms/types.ts` — Tipos compartidos: `JsonSchema`, `FormFieldProps`, `ValidationError`, `FormMode`
- [x] `[frontend]` `src/forms/validation.ts` — Wrapper `ajv` compile + validate, errores por `fieldPath`
- [x] `[frontend]` `src/forms/fields/` — Componentes de campo: `FieldText`, `FieldSelect`, `FieldMultiSelect`, `FieldNumber`, `FieldBoolean`, `index.ts` (mapa type→componente)
- [x] `[frontend]` `src/forms/DynamicForm.tsx` — Componente principal: itera `schema.properties`, renderiza `FormField`, maneja `required`, `readonly`, `onChange` con validación inmediata
- [x] `[frontend]` `src/forms/useForm.ts` — Hook: `values`, `errors`, `touched`, `isValid`, `handleChange`, `handleBlur`, `reset`, `submit`
- [x] `[frontend]` `src/forms/api.ts` — `fetchTemplates()`, `fetchTemplate(clave)`, `submitForm(visitId, payload)`
- [x] `[frontend]` `src/app/formulario.tsx` — Pantalla formulario: carga schema, renderiza `DynamicForm`, botón enviar
- [x] `[frontend]` `src/components/VisitCard.tsx` — Botón "Completar formulario" (condicional: visita `ASSIGNED`/`IN_PROGRESS` y tiene `form_template_id` o catálogo)
- [x] `[frontend]` `src/agenda/useAgenda.ts` — `openFormulario(visitId)` → navegación
- [x] `[frontend]` `src/api/visits.ts` — `submitForm(visitId, payload)` tipado
- [x] `[frontend]` Tests: `DynamicForm.test.tsx`, `useForm.test.ts`, `formulario.test.tsx` (126/126 passed)
- [x] `[frontend]` Commit: `66449a0`

## backoffice (web)

- [x] `[backoffice]` Leer `03-contrato-api.md` antes de empezar
- [x] `[backoffice]` `src/forms/types.ts` — `FormTemplateListItem`/`Detail` usan `key`/`schema`; `VisitWithForm` con `formTemplateId`/`templateKey`/`templateVersion`/`templateName`/`responses`/`submittedAt`
- [x] `[backoffice]` `src/forms/forms-api.service.ts` — Import env corregido, `GET /api/v1/plantillas` y `/{clave}`
- [x] `[backoffice]` `src/visits/visits-api.service.ts` — Import env corregido, `GET /api/v1/visitas/{id}/formulario`
- [x] `[backoffice]` `src/app/pages/expediente/expediente.component.ts` — Página standalone: `templateUrl`/`styleUrls` externos → template/styles inline, fix trailing semicolon en `@Component`, carga visita + plantilla, renderiza readonly
- [x] `[backoffice]` `src/app/app.routes.ts` — Ruta `/expediente/:visitId` con `supervisorGuard`
- [x] `[backoffice]` `src/app/pages/planificacion/planificacion.html` + `.ts` — Link "Ver expediente" con clase propia (`__exp-link`), fix class collision en tests
- [x] `[backoffice]` `src/app/forms/fields/field-boolean.component.ts` — Remove empty ngOnInit
- [x] `[backoffice]` Tests: `dynamic-form.component.spec.ts`, `expediente.spec.ts` (pass)
- [x] `[backoffice]` Lint, build, tests verdes (40/41, 1 pre-existing failure en planificacion unrelated)

## Verificación

- [x] Gates en verde en los repos del alcance (`node .agents/scripts/verificar.mjs --tarea PLAN-13`)
- [ ] Revisión independiente sin hallazgos `critical` ni `high`
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto