# PLAN-75 — Error al validar formularios dinámicos: AJV no reconoce el meta-schema Draft 2020-12

## Contexto y problema

Al abrir un formulario dinámico en la app móvil, la validación completa del formulario (`validateSchema`,
que `DynamicForm` corre al montar) lanza `no schema with key or ref
"https://json-schema.org/draft/2020-12/schema"` y la pantalla se cae.

Las plantillas que sirve el backend declaran `"$schema": "https://json-schema.org/draft/2020-12/schema"`
(ver `V10__forms_seed.sql`), y el motor de validación del backend ya trabaja con Draft 2020-12. Del lado
de los clientes, la instancia de AJV se construye con la clase por defecto del paquete `ajv`, que sólo
conoce el meta-schema de Draft-07: al compilar un schema que declara 2020-12 no encuentra su meta-schema
y falla. Se reprodujo con AJV 8.20.0 (la versión instalada): `new Ajv()` falla y `ajv/dist/2020` compila
el mismo schema y valida bien.

El **backoffice** (`src/app/forms/validation.service.ts`) tiene exactamente la misma construcción, con la
misma versión de AJV. Hoy no explota porque el backoffice sólo muestra formularios en modo lectura (el
expediente), donde no se valida el formulario completo, pero cualquier uso en modo edición o envío
dispararía el mismo error. Se corrige en esta misma tarea: es el mismo defecto, con la misma solución, y
dejarlo implica reabrir el mismo bug cuando alguien use el formulario editable.

La validación por campo (`validateField`) arma un schema mínimo sin `$schema`, por eso no fallaba; tiene
que seguir funcionando igual.

## Alcance

**Repos que toca:** `frontend` (móvil) y `backoffice` (web)

## Criterios de aceptación

1. En el móvil, `validateSchema` sobre un schema que declara `"$schema": "https://json-schema.org/draft/2020-12/schema"`
   no lanza y devuelve `isValid: true` para datos válidos.
2. En el móvil, con ese mismo schema y datos inválidos (falta un requerido, valor fuera de rango, valor
   fuera del `enum`, propiedad no declarada), `validateSchema` devuelve `isValid: false` y los mensajes en
   español de cada regla, igual que antes del cambio.
3. En el móvil, `validateField` sigue validando un campo individual del mismo schema.
4. En el backoffice, `ValidationService.validate` y `ValidationService.validateField` cumplen lo mismo que
   los criterios 1 a 3.
5. Hay tests automatizados en los dos repos que fallan con la construcción anterior de AJV y pasan con la
   nueva.

## Fuera de alcance

- Cambios en el backend o en las plantillas: el backend emite Draft 2020-12 a propósito.
- Cambiar los mensajes de error, la forma de `ValidationResult` o el comportamiento de los campos.
- La CSP del backoffice para la compilación JIT de AJV (resuelta en PLAN-59).

## Preguntas abiertas

Ninguna.
