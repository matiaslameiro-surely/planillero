# PLAN-13 - TASK-07 (Móvil): Renderizador Dinámico de Formularios Tipificados

> Plantilla de la fase 1.

## Contexto y problema

El backend (PLAN-7) ya expone el catálogo de plantillas de formulario con JSON Schema (`GET /api/v1/plantillas` y `GET /api/v1/plantillas/{clave}`) y el endpoint para recibir respuestas (`POST /api/v1/visitas/{id}/formulario`). El seed V10 incluye 3 plantillas de ejemplo: `mantenimiento-general` v1/v2 y `control-de-acceso` v1, con tipos `string`, `number`, `integer`, `boolean`, `enum`, `pattern`, `maxLength`, `minimum`/`maximum`.

Esta tarea implementa el **frontend** que consume ese contrato:
- **Móvil (React Native + Expo)**: renderizador dinámico que, dado un JSON Schema, pinta controles tipificados con validación inline en tiempo real (heurística 5) y envía las respuestas al backend.
- **Backoffice (Angular)**: visor de solo lectura del expediente digital (formulario ya completado) en `/expediente/:visitId`.

## Alcance

**Repos que toca:** `frontend` (móvil), `backoffice` (web)

> El backend **no** se toca: el contrato y la persistencia ya están completos en `main` (PLAN-7 mergeado). Solo se verifica que el endpoint `POST /api/v1/visitas/{id}/formulario` funciona según especificación.

## Criterios de aceptación

1. **Móvil - Catálogo**: `GET /api/v1/plantillas` devuelve lista de plantillas activas; al tocar una, `GET /api/v1/plantillas/{clave}` trae su `schema_json` completo.
2. **Móvil - Renderizado**: Componente `DynamicForm` renderiza controles según `type` del schema:
   - `string` (sin `enum`) → `TextInput` (con `maxLength` si existe)
   - `string` + `enum` → `Picker` (select único)
   - `string` + `pattern` → `TextInput` con validación regex en vivo
   - `number` / `integer` → `TextInput` numérico con `minimum`/`maximum`
   - `boolean` → `Switch`
   - `array` de `string` + `enum` → multi-select (checkboxes)
   - Campos en `required` → marca visual obligatoria (*)
3. **Móvil - Validación inline (H5)**: Al escribir/cambiar, valida contra el schema; muestra error bajo el campo; botón "Enviar" **deshabilitado** si hay `required` vacíos o valores inválidos; **habilitado** solo cuando todo pasa.
4. **Móvil - Sanitización (Ciberseguridad)**: Antes de enviar, `trim` en strings, escape básico, y se rechazan claves no declaradas en `properties` (additionalProperties: false implícito).
5. **Móvil - Envío**: `POST /api/v1/visitas/{id}/formulario` con `{ templateKey, templateVersion, responses }`; en éxito marca visita como con formulario completado y vuelve a agenda.
6. **Móvil - Navegación**: Desde `VisitCard` en agenda, botón "Completar formulario" abre pantalla del formulario correspondiente a la visita (la visita ya tiene `form_template_id` asignado o se elige de catálogo).
6. **Backoffice - Visor**: Ruta `/expediente/:visitId` (solo `SUPERVISOR`/`ADMIN`) muestra: datos de la visita + formulario renderizado **solo lectura** con las respuestas guardadas (usa mismo `DynamicForm` pero modo `readonly`).
7. **Tests móviles**: `DynamicForm.test.tsx` cubre: (a) formulario con `required` vacíos → botón deshabilitado; (b) completa válido → botón habilitado y llama `submitForm`; (c) patrón inválido → error inline; (d) `enum`/`boolean`/`number` rangos.

## Fuera de alcance

- Edición de plantillas en backoffice (solo visor).
- Firma digital / evidencia fotográfica en el formulario (futuro).
- Offline-first para formulario (se envía online; si falla, reintento manual).
- Plantillas anidadas / `oneOf` / `anyOf` complejos (solo `type` simples del seed).

## Preguntas abiertas

- [ ] `NO-BLOQUEANTE` ¿El móvil debe permitir elegir plantilla si la visita no tiene `form_template_id` preasignado, o siempre viene del backend? (Asumo: la visita trae `form_template_id` desde la agenda; si `null`, se muestra catálogo para elegir).
- [ ] `NO-BLOQUEANTE` ¿Validación de `pattern` en móvil debe ser estricta (regex JS) o delegar al backend? (Asumo: validar en cliente para UX + backend como autoridad final).