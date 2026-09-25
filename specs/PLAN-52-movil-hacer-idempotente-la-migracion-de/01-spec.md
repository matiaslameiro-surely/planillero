# PLAN-52 — Móvil: hacer idempotente la migración de agendaSchema a v4

## Contexto y problema

El paso `if (version < 4)` de `frontend/src/db/agendaSchema.ts` agrega a `agenda_visits` las columnas
`form_template_id`, `form_template_version` y `form_submitted_at` con `ALTER TABLE ... ADD COLUMN`
directos. Si alguna ya existe, SQLite rechaza la sentencia:

```
Call to function 'NativeDatabase.execAsync' has been rejected.
→ Caused by: duplicate column name: form_template_id
```

El caso real son los dispositivos que corrieron el paso v2 **anterior a PLAN-47**, que agregaba esas
mismas columnas. PLAN-47 las sacó del v2 para que una base nueva no las duplicara, pero esos
dispositivos ya las tienen y quedaron en `user_version` 2 o 3. Al llegar al v4 fallan. Como el
`ALTER` que falla aborta el bloque antes del `PRAGMA user_version = 4`, la versión no sube y el error
se repite en cada apertura: la agenda queda inaccesible hasta reinstalar.

El issue pide que el paso v4 sea idempotente: que mire qué columnas existen y agregue sólo las que
faltan.

## Alcance

**Repos que toca:** `frontend` (móvil) y `harness`

El harness se sumó durante la revisión: los tests contra SQLite real usan `node:sqlite`, que
necesita Node 22.13+, y `AGENTS.md` e `init.mjs` todavía aceptaban Node 20 (ver criterio 7).

## Criterios de aceptación

1. Antes de agregar columnas, el paso v4 consulta `PRAGMA table_info(agenda_visits)` para conocer las
   columnas existentes.
2. El paso v4 ejecuta `ALTER TABLE agenda_visits ADD COLUMN` sólo para las columnas de formulario que
   no existen. Si ya están las tres, no ejecuta ningún `ALTER TABLE`.
3. Tanto una base nueva (versión 0) como una base en versión 1, 2 o 3 que ya tenga una, dos o las
   tres columnas terminan en `PRAGMA user_version = 4` sin error.
4. Una base que ya está en versión 4 no ejecuta ningún paso ni consulta `table_info`.
5. `src/db/agendaSchema.test.ts` sigue en verde e incluye casos para las columnas ya existentes (todas
   y algunas).
6. Los gates del frontend (`lint`, `tipos`, `tests`) pasan en verde.
7. La migración se prueba también contra SQLite real, y esa prueba no se puede saltear: el frontend
   declara un rango de Node con `node:sqlite` (`engines` y `.nvmrc`) y la suite falla con un mensaje
   claro si falta el módulo. En el harness, `AGENTS.md` e `init.mjs --check` usan el rango del equipo
   que ya fija el `README.md`: 22.22.3+ o 24.15+, que incluye `node:sqlite`.

## Fuera de alcance

- Hacer idempotentes los pasos 1 a 3: ya usan `CREATE ... IF NOT EXISTS`.
- Cambiar el mecanismo de versionado (`PRAGMA user_version`) o sumar un paso v5.
- Reparar datos de las columnas existentes: sólo se garantiza que existan.
- Cambios en `backend` o `backoffice`.
- Un CI para el frontend: hoy no existe y armarlo es otra tarea.

## Preguntas abiertas

Ninguna.
