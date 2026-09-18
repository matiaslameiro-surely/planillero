# Tareas — PLAN-7

## backend

- [x] `[backend]` Crear la rama `PLAN-7-task-07-backend-motor-de-validacion` desde `main`
- [x] `[backend]` Sumar `com.networknt:json-schema-validator:3.0.7` al `pom.xml`
- [x] `[backend]` `V5__forms_schema.sql`: tabla `forms.form_templates` (clave, versión, nombre,
      schema JSONB, activa), único `(key, version)`, índice GIN sobre el schema y trigger que
      rechaza modificar una plantilla publicada
- [x] `[backend]` `V5__forms_schema.sql`: tabla `visits.visits` mínima con `responses_json` JSONB,
      referencia a la plantilla usada e índice GIN sobre las respuestas
- [x] `[backend]` `V6__forms_seed.sql`: dos plantillas ficticias que ejerciten todos los tipos de
      regla, y una visita de ejemplo para poder probar el envío
- [x] `[backend]` Entidades `FormTemplate` y `Visit` con el JSON mapeado como `String` vía
      `@JdbcTypeCode(SqlTypes.JSON)`, más sus repositorios
- [x] `[backend]` **Motor** `FormSchemaValidator` + `FieldViolation`: valida contra 2020-12 y
      traduce los errores de la librería, acumulando todas las violaciones
- [x] `[backend]` `FormValidationException` y su manejo en `ApiExceptionHandler`; sumar
      `ApiException.notFound(...)`
- [x] `[backend]` `FormTemplateService` + `FormTemplateController`: `GET /api/v1/plantillas` y
      `GET /api/v1/plantillas/{clave}`
- [x] `[backend]` `VisitFormService` + `VisitFormController`:
      `POST /api/v1/visitas/{id}/formulario`, con persistencia sólo si la validación pasa
- [x] `[backend]` `FormSchemaValidatorTest`: un test por tipo de regla y uno de violaciones múltiples
- [x] `[backend]` `FormTemplateIntegrationTest` y `VisitFormIntegrationTest`, incluido el caso de
      inyección SQL en un valor de respuesta
- [x] `[backend]` Actualizar el `README.md` del backend con los endpoints y el modelo de plantillas
- [x] `[backend]` Emitir `03-contrato-api.md` *(lo consume PLAN-13, renderizador móvil)*

## frontend *(app móvil)*

No aplica: fuera del alcance de esta tarea.

## backoffice *(web)*

No aplica: fuera del alcance de esta tarea.

## Verificación

- [x] Gates en verde en `backend` (`node .agents/scripts/verificar.mjs --tarea PLAN-7`)
- [x] Revisión independiente sin hallazgos `critical` ni `high`
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto
