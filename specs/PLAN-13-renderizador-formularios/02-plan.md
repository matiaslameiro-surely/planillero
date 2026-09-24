# Plan técnico - PLAN-13

## Enfoque

El backend ya expone el contrato completo (PLAN-7 mergeado en `main`): `GET /api/v1/plantillas`, `GET /api/v1/plantillas/{clave}`, `POST /api/v1/visitas/{id}/formulario`. La tarea implementa **solo los dos frontends** que consumen ese contrato:

1. **Frontend Móvil (React Native + Expo)**: Renderizador dinámico `DynamicForm` que recibe un JSON Schema y pinta controles tipificados con validación inline. Integrado en la agenda: botón "Completar formulario" en `VisitCard` → pantalla de formulario → envío al backend.
2. **Backoffice (Angular)**: Visor de solo lectura en `/expediente/:visitId` que muestra la visita y su formulario completado (mismo `DynamicForm` en modo `readonly`).

El componente central `DynamicForm` se escribe **una vez en TypeScript** (sin JSX de React Native) y se adapta a cada plataforma vía capa de renderizado nativa (`FormField.native.tsx` / `FormField.web.ts`). La validación usa `ajv` (ya en deps del móvil por PLAN-9) y esquema compartido.

## Archivos a tocar

### backend/

| Archivo | Acción | Para qué |
|---|---|---|
| (ninguno) | — | Contrato ya completo en `main`. Solo verificación de que `POST /api/v1/visitas/{id}/formulario` existe y valida con `FormSchemaValidator`. |

### frontend/ (móvil)

| Archivo | Acción | Para qué |
|---|---|---|
| `src/forms/types.ts` | crear | Tipos TypeScript: `JsonSchema`, `FormFieldProps`, `ValidationError`, `FormMode` |
| `src/forms/validation.ts` | crear | Wrapper `ajv` compile + validate, mapa de errores por `fieldPath` |
| `src/forms/DynamicForm.tsx` | crear | Componente principal: itera `schema.properties`, renderiza `FormField` por cada propiedad, maneja `required`, `readonly`, `onChange` con validación inmediata |
| `src/forms/fields/FieldText.tsx` | crear | `string` sin `enum` → `TextInput` con `maxLength`, `pattern` validation |
| `src/forms/fields/FieldSelect.tsx` | crear | `string` + `enum` → `Picker` (single select) |
| `src/forms/fields/FieldMultiSelect.tsx` | crear | `array` items `string` + `enum` → checkboxes horizontales |
| `src/forms/fields/FieldNumber.tsx` | crear | `number` / `integer` → `TextInput` numérico con `minimum`/`maximum` |
| `src/forms/fields/FieldBoolean.tsx` | crear | `boolean` → `Switch` |
| `src/forms/fields/index.ts` | crear | Barrel export + mapa `type` → componente |
| `src/forms/useForm.ts` | crear | Hook: estado `values`, `errors`, `touched`, `isValid`, `handleChange`, `handleBlur`, `reset`, `submit` |
| `src/forms/api.ts` | crear | `fetchTemplates()`, `fetchTemplate(clave)`, `submitForm(visitId, payload)` |
| `src/app/formulario.tsx` | crear | Pantalla formulario: carga schema (de visita o catálogo), renderiza `DynamicForm`, botón enviar |
| `src/components/VisitCard.tsx` | modificar | Agregar botón "Completar formulario" (solo si visita `ASSIGNED` o `IN_PROGRESS` y tiene `form_template_id` o catálogo disponible) |
| `src/agenda/useAgenda.ts` | modificar | Función `openFormulario(visitId)` → navegación a `/formulario?visitId=...` |
| `src/api/visits.ts` | modificar | Agregar `submitForm(visitId, payload)` tipado |

### backoffice/ (web)

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/pages/expediente/expediente.ts` | crear | Componente standalone: carga visita + formulario (`GET /api/v1/visitas/{id}` + `GET /api/v1/plantillas/{clave}`), renderiza `DynamicForm` readonly |
| `src/app/pages/expediente/expediente.html` | crear | Template HTML |
| `src/app/pages/expediente/expediente.scss` | crear | Estilos |
| `src/app/pages/expediente/expediente.spec.ts` | crear | Tests |
| `src/forms/dynamic-form.component.ts` | crear | Componente Angular wrapper de `DynamicForm` (web): usa mismos tipos/validación, renderiza controles con Angular Material / native HTML |
| `src/forms/form-field.component.ts` | crear | Campo genérico Angular |
| `src/forms/fields/*.component.ts` | crear | Componentes por tipo (text, select, multiselect, number, boolean) |
| `src/forms/validation.service.ts` | crear | Servicio `ajv` singleton |
| `src/app/app.routes.ts` | modificar | Agregar ruta `/expediente/:visitId` con `canActivate: [supervisorGuard]` |
| `src/app/pages/planificacion/planificacion.ts` | modificar | Link "Ver expediente" en `VisitCard` → `/expediente/${visit.id}` |

## Decisiones técnicas

- **`DynamicForm` compartido en TypeScript puro** - Se descartó duplicar lógica en React Native y Angular porque el schema, validación y mapeo `type`→componente son idénticos; solo cambia la capa de render (JSX vs Angular template).
- **`ajv` para validación** - Se descartó validación manual porque `ajv` ya está en `package.json` del móvil (PLAN-9), soporta JSON Schema Draft 2020-12, y da errores estructurados por `instancePath`.
- **`additionalProperties: false` implícito** - Se descartó permitir propiedades extra porque el backend rechaza claves no declaradas; sanitizar en cliente evita round-trips.
- **Backoffice solo lectura** - Se descartó edición porque la spec dice "visor estandarizado del expediente digital"; el formulario lo completa el operador en móvil.
- **Catálogo opcional en móvil** - Si la visita no tiene `form_template_id`, se muestra lista de plantillas activas (`GET /api/v1/plantillas`) para elegir. Se descartó obligar pre-asignación porque el flujo real puede variar.

## Contrato de API (ya existente en backend `main`)

| Método | Ruta | Request | Response |
|---|---|---|---|
| GET | `/api/v1/plantillas` | — | `FormTemplateResponse[]` (id, templateKey, version, name, active) |
| GET | `/api/v1/plantillas/{clave}` | — | `FormTemplateResponse` + `schema_json` (JSON Schema completo) |
| POST | `/api/v1/visitas/{id}/formulario` | `FormSubmissionRequest { templateKey, templateVersion, responses }` | `FormSubmissionResponse { visitId, templateKey, templateVersion, submittedAt }` |

## Supuestos

- `RIESGO` El endpoint `POST /api/v1/visitas/{id}/formulario` en `main` acepta exactamente el payload descrito y valida con `FormSchemaValidator` (ya verificado en código).
- `RIESGO` Los JSON Schema de las plantillas V10 usan solo los tipos `string`, `number`, `integer`, `boolean`, `array` con `enum`, y keywords `required`, `enum`, `pattern`, `maxLength`, `minimum`, `maximum`, `items`. Si aparecen `oneOf`, `anyOf`, `dependencies`, etc., el renderizador no los soporta.
- La visita expuesta por `GET /api/v1/visitas/{id}` (backoffice) incluye `form_template_id` y `respuestas_json` para el visor.
- `ajv` versión en `package.json` del móvil es compatible con Draft 2020-12.

## Cómo se prueba

1. **Móvil - Unit**: `DynamicForm.test.tsx` renderiza schema del seed (mant v2) → 5 campos, `required` marcados; `useForm` valida vacío → error; completa → `isValid=true`.
2. **Móvil - Integración**: `formulario.test.tsx` mock `fetchTemplate` + `submitForm` → navega, rellena, envía, vuelve a agenda.
3. **Backoffice - Unit**: `DynamicFormComponent` con schema mant v2 + respuestas JSON → muestra valores, inputs disabled.
4. **Backoffice - Integración**: `expediente.spec.ts` mock `HttpClient` → carga visita + plantilla → renderiza.
5. **Gates**: `verificar.mjs --tarea PLAN-13` → compile, lint, tests, tipos en ambos repos.