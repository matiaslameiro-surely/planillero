# PLAN-7 — TASK-07 (Backend): Motor de Validación JSON Schema y Columnas JSONB

## Contexto y problema

Planillero necesita que los formularios que completa un operario en la visita no estén cableados en
el código: cada tipo de trabajo tiene su propio conjunto de campos, y esos campos cambian con el
tiempo sin que se pueda redeployar la aplicación cada vez. La forma de cada formulario se describe
entonces como **JSON Schema**, se versiona, y las respuestas se guardan tal cual las mandó el
cliente, en una columna **JSONB** de PostgreSQL.

Hoy el backend no tiene nada de esto. Las migraciones existentes (`V1`–`V3`) crean los esquemas
lógicos (`core`, `visits`, `forms`, `audit`) y las tablas de autenticación, pero ni `forms` ni
`visits` tienen una sola tabla. Tampoco hay ninguna dependencia de validación de JSON Schema en el
`pom.xml`.

La pieza central es el **motor de validación**: un componente que, dado el identificador de una
plantilla y un payload de respuestas, decide si el payload cumple el schema y, si no cumple,
devuelve **qué campo falló y por qué** en un formato que el cliente móvil pueda mostrar campo por
campo. Sin eso, el renderizador dinámico del móvil (PLAN-13) no tiene contra qué validar y la
persistencia JSONB se convierte en un depósito de datos sin forma.

El issue de Jira agrega dos ejes de evaluación que la spec toma como requisitos y no como
comentarios: **consistencia de tipos de campo** (heurística 4 de Nielsen) y **OWASP A03 –
Injection**, que acá significa que ninguna parte del payload puede llegar a construir SQL y que una
plantilla ya usada no se puede modificar en el lugar.

## Alcance

**Repos que toca:** `backend`

No toca `frontend` ni `backoffice`. Esta tarea **emite el contrato** (`03-contrato-api.md`) que
después consume PLAN-13 (renderizador dinámico móvil).

## Criterios de aceptación

1. `GET /api/v1/plantillas` devuelve `200` con la lista de plantillas de formulario **activas**,
   cada una con su clave, nombre, número de versión y el JSON Schema completo. Requiere token válido
   (`401` sin él).
2. `GET /api/v1/plantillas/{clave}` devuelve `200` con la **última versión activa** de esa plantilla,
   y `404` con código de error estable si la clave no existe.
3. `POST /api/v1/visitas/{id}/formulario` con un payload que cumple el schema de la plantilla
   indicada devuelve `200`, y las respuestas quedan persistidas en la columna JSONB de la visita
   junto con la referencia a la versión de plantilla usada.
4. `POST /api/v1/visitas/{id}/formulario` con un payload que **no** cumple el schema devuelve `400`
   con un cuerpo que lista **cada** violación por separado, indicando la ruta del campo (por ejemplo
   `/horas`), el tipo de regla incumplida y un mensaje legible. Un payload con tres campos mal
   reporta las tres violaciones, no la primera.
5. La validación cubre, con test unitario por caso: campo requerido ausente, tipo incorrecto,
   valor fuera de rango (`minimum`/`maximum`), string que no cumple `pattern` o `maxLength`, valor
   fuera de un `enum`, y propiedad no declarada cuando el schema fija `additionalProperties: false`.
6. Una migración Flyway crea la tabla de plantillas de formulario y la columna JSONB de respuestas
   en la tabla de visitas, con **índice GIN** sobre ambas columnas JSONB. `./mvnw -B test` levanta
   el esquema completo desde cero contra el PostgreSQL de Testcontainers sin errores de validación
   de Hibernate (`ddl-auto=validate`).
7. Las plantillas son **inmutables por versión**: una restricción de base de datos impide que exista
   dos veces la misma combinación clave + versión, y el código nunca actualiza el schema de una fila
   existente. Publicar un cambio crea una versión nueva.
8. Enviar el formulario de una visita inexistente devuelve `404`; enviarlo referenciando una
   plantilla inexistente o inactiva devuelve `400` con un código de error distinto del de validación
   de campos.
9. Ninguna consulta construye SQL por concatenación de texto: todo acceso a datos pasa por JPA o por
   consultas parametrizadas. Un valor de respuesta que contenga texto tipo `'; drop table …` se
   persiste como dato literal y no altera el esquema (test que lo demuestra).
10. `node .agents/scripts/verificar.mjs --tarea PLAN-7` corre los gates del backend en verde.

## Fuera de alcance

- **Renderizado** de los formularios en el cliente móvil o web (eso es PLAN-13).
- **ABM de plantillas** (crear, editar o dar de baja plantillas por API o desde el backoffice). En
  esta tarea las plantillas se cargan por migración como datos de seed ficticios.
- El ciclo de vida de la visita en sí: alta, asignación, inicio con GPS y cierre. La tabla de
  visitas se crea acá con **el mínimo indispensable** para poder colgar las respuestas; los campos
  de geolocalización y timestamps son de PLAN-9.
- Sincronización offline e idempotencia de reenvíos (PLAN-14).
- Firma digital, evidencias y manifiesto HMAC (PLAN-10).
- Auditoría append-only de los cambios (PLAN-11).
- Internacionalización de los mensajes de validación: van en español, fijo.

## Preguntas abiertas

- [ ] `NO-BLOQUEANTE` **La tabla de visitas no existe todavía y PLAN-9 la está tocando en
  paralelo.** PLAN-9 (TASK-04 Móvil + TASK-05, "En curso", asignada a otra persona) declara en su
  alcance "campos de latitud, longitud, precisión y timestamps en tabla visitas", pero en `main` del
  backend no hay ninguna tabla de visitas: el esquema `visits` está vacío.
  **Supuesto con el que se avanza:** PLAN-7 crea la tabla de visitas con lo mínimo
  (identificador, estado, marca de creación) más la columna JSONB de respuestas, y PLAN-9 le agrega
  sus columnas con su propia migración. Si PLAN-9 ya creó la tabla en su rama, las dos migraciones
  van a chocar al mergear y hay que reconciliarlas a mano. Conviene avisarle a quien lleva PLAN-9.
- [ ] `NO-BLOQUEANTE` **Las rutas de la API van en español** (`/api/v1/plantillas`,
  `/api/v1/visitas/{id}/formulario`) porque así las fija el issue y así las usa PLAN-9
  (`/api/v1/visitas/{id}/iniciar`). El código Java que las implementa va en inglés, como manda la
  convención. Si el equipo prefiere rutas en inglés, hay que cambiarlo en todos los issues a la vez,
  no acá.
- [ ] `NO-BLOQUEANTE` **Qué plantillas de seed se cargan.** Se cargan dos plantillas ficticias, con
  campos genéricos, suficientes para ejercitar todos los tipos de validación. No representan ningún
  formulario real de ningún cliente.
