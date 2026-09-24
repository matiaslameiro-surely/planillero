# PLAN-47 — Bug: error al migrar agendaSchema por columnas duplicadas en v2 y v4

## Contexto y problema

Al inicializar la aplicación móvil desde cero en un dispositivo limpio (con versión de esquema SQLite 0), la apertura de la base de datos local falla al iniciar sesión con el siguiente error:

```
Call to function 'NativeDatabase.execAsync' has been rejected.
→ Caused by: duplicate column name: form_template_id
```

La causa raíz se encuentra en `frontend/src/db/agendaSchema.ts`: las columnas `form_template_id`, `form_template_version` y `form_submitted_at` para el soporte de formularios dinámicos fueron añadidas mediante sentencias `ALTER TABLE agenda_visits ADD COLUMN ...` tanto en el bloque `if (version < 2)` como en el bloque `if (version < 4)`. Al iniciar desde la versión 0, ambas condiciones se cumplen en la misma ejecución y SQLite rechaza la duplicación de nombres de columna.

## Alcance

**Repos que toca:** `frontend` (móvil)

## Criterios de aceptación

1. Una base de datos nueva (versión 0) ejecuta la migración completa alcanzando la versión 4 (`PRAGMA user_version = 4`) sin errores de columnas duplicadas.
2. El bloque `version < 2` en `frontend/src/db/agendaSchema.ts` crea únicamente la tabla `visit_audit_traces` con su índice, sin sentencias `ALTER TABLE` sobre `agenda_visits`.
3. El bloque `version < 4` en `frontend/src/db/agendaSchema.ts` añade las tres columnas `form_template_id`, `form_template_version` y `form_submitted_at` sobre `agenda_visits` y actualiza la versión a 4.
4. Se agregan pruebas unitarias en `frontend/src/db/agendaSchema.test.ts` que validan la migración incremental desde todas las versiones previas (0, 1, 2, 3 y 4).
5. Todos los gates de verificación del frontend (`lint`, `tipos`, `tests`) pasan en verde.

## Fuera de alcance

- Modificaciones en `backend` o `backoffice`.
- Cambios en la lógica de negocio de formularios o auditoría fuera del esquema SQLite.

## Preguntas abiertas

Ninguna.
