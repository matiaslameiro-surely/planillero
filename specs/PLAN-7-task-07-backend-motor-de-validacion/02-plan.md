# Plan técnico — PLAN-7

## Enfoque

La decisión que ordena todo lo demás: **el schema es un dato, no código**. Una plantilla de
formulario es una fila con un JSON Schema adentro, y el motor de validación es un componente sin
estado que recibe `(schema, payload)` y devuelve una lista de violaciones. Ningún tipo de campo
está cableado en Java: agregar un campo nuevo es insertar una versión nueva de plantilla, no
recompilar.

Sobre eso se apoyan tres piezas:

1. **Persistencia JSONB.** Dos tablas nuevas: `forms.form_templates` (el catálogo de plantillas,
   con el schema en JSONB) y `visits.visits` (mínima, con `responses_json` en JSONB). Las dos
   columnas JSONB llevan índice **GIN**, que es lo que hace que buscar por contenido del JSON no
   sea un scan completo. Los esquemas lógicos `forms` y `visits` ya los crea `V1`: acá recién se
   llenan.
2. **El motor.** `FormSchemaValidator`, un `@Component` sin estado que envuelve
   `com.networknt:json-schema-validator`. Traduce los errores de la librería a un tipo propio
   (`FieldViolation`: ruta del campo, palabra clave incumplida, mensaje) para que el resto del
   backend y el cliente móvil no queden atados a la API de la librería.
3. **El envío.** `POST /api/v1/visitas/{id}/formulario` resuelve la visita y la plantilla, valida,
   y recién si no hay violaciones persiste el JSON de respuestas. Si hay violaciones, **devuelve
   todas**, no la primera: el renderizador móvil necesita pintar todos los campos en rojo de una
   sola pasada.

**El payload se guarda como texto JSON literal** (`String` mapeado con `@JdbcTypeCode(SqlTypes.JSON)`),
no como un grafo de objetos Java. Eso es a la vez lo más simple y lo que responde a OWASP A03: el
valor viaja siempre como parámetro de un `PreparedStatement`, nunca concatenado, así que un texto
como `'; drop table ...` se guarda como los caracteres que son.

**La inmutabilidad de plantillas se hace valer en la base, no por disciplina.** Un índice único
`(key, version)` impide duplicar una versión, y un trigger `before update` rechaza cualquier intento
de modificar el schema de una fila ya publicada. Publicar un cambio es insertar `version + 1`.

## Archivos a tocar

### backend/

| Archivo | Acción | Para qué |
|---|---|---|
| `pom.xml` | modificar | Sumar `com.networknt:json-schema-validator:3.0.7` |
| `src/main/resources/db/migration/V5__forms_schema.sql` | crear | Tablas `forms.form_templates` y `visits.visits`, índices GIN, unicidad y trigger de inmutabilidad |
| `src/main/resources/db/migration/V6__forms_seed.sql` | crear | Dos plantillas ficticias de seed y una visita de ejemplo |
| `src/main/java/ar/com/planillero/forms/FormTemplate.java` | crear | Entidad de plantilla (clave, versión, nombre, schema JSONB, activa) |
| `src/main/java/ar/com/planillero/forms/FormTemplateRepository.java` | crear | Consultas derivadas: activas, última versión por clave |
| `src/main/java/ar/com/planillero/forms/FormTemplateService.java` | crear | Resolución de plantilla por clave/versión, errores de negocio |
| `src/main/java/ar/com/planillero/forms/FormTemplateController.java` | crear | `GET /api/v1/plantillas` y `GET /api/v1/plantillas/{clave}` |
| `src/main/java/ar/com/planillero/forms/FormSchemaValidator.java` | crear | **El motor**: valida un payload contra un schema y traduce los errores |
| `src/main/java/ar/com/planillero/forms/FieldViolation.java` | crear | Una violación: ruta del campo, palabra clave, mensaje |
| `src/main/java/ar/com/planillero/forms/FormValidationException.java` | crear | Excepción que transporta la lista de violaciones al handler |
| `src/main/java/ar/com/planillero/forms/dto/FormTemplateResponse.java` | crear | Plantilla como la ve el cliente |
| `src/main/java/ar/com/planillero/forms/dto/FormSubmissionRequest.java` | crear | `templateKey`, `templateVersion` opcional, `responses` |
| `src/main/java/ar/com/planillero/forms/dto/FormSubmissionResponse.java` | crear | Confirmación: visita, plantilla usada, momento de envío |
| `src/main/java/ar/com/planillero/forms/dto/ValidationErrorResponse.java` | crear | Cuerpo del `400` con la lista de violaciones |
| `src/main/java/ar/com/planillero/visits/Visit.java` | crear | Entidad mínima de visita con `responses_json` |
| `src/main/java/ar/com/planillero/visits/VisitRepository.java` | crear | Acceso a visitas |
| `src/main/java/ar/com/planillero/visits/VisitFormService.java` | crear | Orquesta: resolver visita + plantilla, validar, persistir |
| `src/main/java/ar/com/planillero/visits/VisitFormController.java` | crear | `POST /api/v1/visitas/{id}/formulario` |
| `src/main/java/ar/com/planillero/common/ApiException.java` | modificar | Sumar la fábrica `notFound(...)` |
| `src/main/java/ar/com/planillero/common/ApiExceptionHandler.java` | modificar | Manejar `FormValidationException` → `400` con violaciones |
| `src/test/java/ar/com/planillero/forms/FormSchemaValidatorTest.java` | crear | Unitarios del motor, un test por tipo de regla |
| `src/test/java/ar/com/planillero/forms/FormTemplateIntegrationTest.java` | crear | `GET /api/v1/plantillas` con y sin token |
| `src/test/java/ar/com/planillero/visits/VisitFormIntegrationTest.java` | crear | Envío válido, inválido, 404, plantilla inexistente, inyección SQL |
| `README.md` | modificar | Documentar los endpoints nuevos y el modelo de plantillas |

Total: **24 archivos** (21 nuevos, 3 modificados). Supera el límite de 12 de `workspace.json`, así
que el checkpoint del plan es obligatorio.

## Decisiones técnicas

- **Librería `com.networknt:json-schema-validator` 3.0.7** — Se descartó escribir un validador
  propio porque JSON Schema 2020-12 tiene decenas de palabras clave con semántica sutil y
  reimplementarlas es garantía de discrepancias con el cliente. Se descartó la línea `1.5.x` de la
  misma librería porque usa Jackson 2 (`com.fasterxml`) y este proyecto corre sobre Spring Boot
  4.1.1, que trae **Jackson 3** (`tools.jackson`, verificado en el árbol de dependencias): la 3.0.7
  es la que compila contra Jackson 3 sin arrastrar una segunda copia de Jackson.
- **Dialecto fijo 2020-12** — Se descartó aceptar el dialecto que declare cada plantilla en su
  `$schema` porque habilita que cada plantilla se comporte distinto; una sola versión del estándar
  es lo que sostiene la heurística 4 (consistencia de tipos y reglas).
- **JSON guardado como `String` con `@JdbcTypeCode(SqlTypes.JSON)`** — Se descartó mapear a
  `Map<String, Object>` o a un grafo de POJOs porque obliga a serializar y deserializar en cada
  lectura, cambia el orden de las claves y pierde la forma exacta que envió el cliente, que después
  hace falta para la firma digital (PLAN-10) y la auditoría (PLAN-11).
- **Validación que acumula todas las violaciones** — Se descartó cortar en la primera (más barato)
  porque el formulario móvil necesita marcar todos los campos con problema de una vez; validar de a
  un error por viaje es exactamente la experiencia que la heurística 4 busca evitar.
- **Inmutabilidad reforzada por trigger en PostgreSQL** — Se descartó dejarla sólo en la capa de
  servicio porque un `update` desde una consola o desde otro servicio la saltea, y la premisa de
  "versionado inmutable de plantillas" del issue es un control de seguridad, no una convención.
- **Las plantillas se cargan por migración, no por API** — Se descartó exponer un ABM de plantillas
  porque es el módulo de administración del backoffice y no está en el alcance de esta tarea; se
  agrega cuando exista el issue que lo pida.
- **La tabla de visitas se crea acá con lo mínimo** — Se descartó esperar a PLAN-9 porque bloquearía
  esta tarea sin fecha, y se descartó modelar la visita completa porque pisaría el diseño de quien
  está haciendo PLAN-9. Se crean sólo `id`, `status`, `created_at` y las columnas de formulario.
- **Rutas en español, código en inglés** — Se descartó traducir las rutas a inglés porque el issue
  y PLAN-9 (`/api/v1/visitas/{id}/iniciar`) las fijan en español, y una API mitad y mitad es peor
  que cualquiera de las dos opciones puras.

## Contrato de API

El alcance es sólo `backend`, así que no hay cliente esperando en esta tarea. Igual se emite
`03-contrato-api.md` en la fase 3, porque **PLAN-13 (renderizador dinámico móvil) lo consume**.

| Método | Ruta | Request | Response |
|---|---|---|---|
| `GET` | `/api/v1/plantillas` | — (Bearer) | `200` lista de plantillas activas con su JSON Schema |
| `GET` | `/api/v1/plantillas/{clave}` | — (Bearer) | `200` última versión activa · `404` `template_not_found` |
| `POST` | `/api/v1/visitas/{id}/formulario` | `{ templateKey, templateVersion?, responses }` | `200` confirmación · `400` `form_validation_failed` con `violations[]` · `400` `template_not_found` · `404` `visit_not_found` |

## Supuestos

- `RIESGO` **Nadie más está creando la tabla de visitas en este momento.** PLAN-9 está "En curso"
  con otra persona y declara campos sobre la tabla de visitas. Si su rama ya la crea, las dos
  migraciones colisionan al mergear y hay que reconciliarlas a mano (una de las dos pasa a ser un
  `alter table`). Es la razón principal por la que este plan pide aprobación.
- `RIESGO` — **Resuelto en el cierre: se renumeró a `V5`/`V6` porque PLAN-10 ya usa `V4`.** **Los números de migración `V4` y `V5` están libres.** Las ramas en curso de PLAN-9 y
  PLAN-10 pueden estar usando los mismos números; Flyway falla si dos migraciones distintas
  comparten versión. Se resuelve renumerando al mergear, pero conviene saberlo antes.
- La versión 3.0.7 de `json-schema-validator` existe en Maven Central y resuelve — **verificado**:
  se descargó el artefacto y se inspeccionó su API (`SchemaRegistry`, `Schema#validate`, `Error`),
  que efectivamente usa `tools.jackson`.
- El `ddl-auto=validate` de Hibernate exige que las entidades coincidan exactamente con lo que crea
  Flyway. Cualquier desajuste de tipo o de nombre revienta al levantar el contexto en los tests, así
  que el propio arranque de la suite es el control.
- Las plantillas de seed son ficticias y no representan ningún formulario de ningún cliente real.
- Los endpoints de plantillas quedan accesibles a cualquier usuario autenticado (los tres roles):
  un operario necesita leer las plantillas para completar el formulario.

## Cómo se prueba

- `./mvnw -B test` con Docker corriendo: levanta PostgreSQL con Testcontainers y aplica `V1`–`V6`
  desde cero. Si el esquema y las entidades no coinciden, la suite no arranca.
- **Unitarios del motor** (`FormSchemaValidatorTest`), sin Spring y sin base: un test por tipo de
  regla (requerido, tipo, rango, patrón, longitud, enum, propiedad no declarada) más uno que
  comprueba que un payload con tres errores devuelve tres violaciones.
- **Integración** contra la cadena de seguridad real: login con `operador.demo`, `GET` de
  plantillas, envío válido (`200` + fila persistida), envío inválido (`400` + violaciones), visita
  inexistente (`404`), plantilla inexistente (`400`), y el caso de inyección: un valor de respuesta
  con una sentencia SQL adentro se guarda literal y las tablas siguen existiendo.
- `node .agents/scripts/verificar.mjs --tarea PLAN-7` para los gates del harness.

## Cambios posteriores al checkpoint

Mientras el PR estaba abierto se mergearon PLAN-10 y PLAN-8 en `main`, y PLAN-9 abrió su PR. Para
resolver el conflicto (pedido en la revisión humana del PR #5) cambió parte del diseño aprobado:

- **La tabla `visits.visits` ya no se crea acá.** La crea PLAN-8 en `V7`, con su propio modelo de
  visita (código, dirección, coordenadas, jurisdicción, urgencia). Esta tarea sólo le **agrega** las
  columnas del formulario (`form_template_id`, `responses_json`, `form_submitted_at`) e índice GIN.
- **Migraciones renumeradas a `V9`/`V10`**, para correr después de `V7` (PLAN-8) y `V8` (PLAN-9).
  Una versión menor habría quedado fuera de orden en las bases donde `V7` ya se aplicó.
- **Entidad angosta `VisitFormRecord`** en lugar de una `Visit` propia: mapea sólo `id` y las tres
  columnas del formulario de `visits.visits`. Se descartó sumar los campos a `planning.Visit`
  porque el PR abierto de PLAN-9 también la modifica, y se descartó una tabla aparte porque el issue
  pide la columna de respuestas en la tabla de visitas.
- **Enviar el formulario no cambia el `status` de la visita**: ese estado es del ciclo de vida de
  PLAN-8/9, y además su `check` no admite otros valores.
- **Los tests crean sus propias visitas** en lugar de depender del seed de PLAN-8.

Verificado: 77/77 tests con `main` integrado, y 96/96 con el PR de PLAN-9 mergeado encima en un
worktree temporal.
