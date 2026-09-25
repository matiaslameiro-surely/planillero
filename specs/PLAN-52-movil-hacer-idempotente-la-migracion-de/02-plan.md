# Plan técnico — PLAN-52

## Enfoque

El paso `if (version < 4)` de `ensureAgendaSchema` deja de mandar tres `ALTER TABLE` fijos. Primero lee
las columnas de `agenda_visits` con `db.getAllAsync('PRAGMA table_info(agenda_visits)')`, después arma
un `ALTER TABLE ... ADD COLUMN` sólo por cada columna de formulario que falte, y los ejecuta en un único
`execAsync` que termina en `PRAGMA user_version = 4`. Si no falta ninguna, ese `execAsync` sólo sube la
versión.

Las tres columnas se declaran una sola vez, en una constante con nombre y tipo, para que la consulta y
el `ALTER` no puedan desalinearse.

Se edita un paso ya publicado, y eso contradice la regla del comentario de la función («un paso ya
publicado no se edita»). Acá es seguro: en los dispositivos que ya llegaron a v4 el paso no vuelve a
correr, y en los que no llegaron es justamente el paso que falla. Sumar un v5 no serviría, porque el
v4 revienta antes. El comentario del paso deja asentada esta excepción.

## Archivos a tocar

### frontend/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/db/agendaSchema.ts` | modificar | Paso v4 idempotente con `PRAGMA table_info` |
| `src/db/agendaSchema.test.ts` | modificar | El doble de la base suma `getAllAsync`, más los casos «ya tiene todas» y «ya tiene algunas» |

## Decisiones técnicas

- **Consultar `PRAGMA table_info` y agregar sólo lo que falta.** Se descartó ejecutar cada `ALTER`
  por separado atrapando el error `duplicate column name`, porque depende del texto del mensaje
  nativo y confunde un error esperado con uno real. También se descartó recrear la tabla (copiar,
  borrar y renombrar), porque es mucho más código y más riesgo para agregar tres columnas nulables.
- **Un único `execAsync` con los `ALTER` que falten y el `PRAGMA user_version = 4`.** Se mantiene la
  forma de los otros pasos: la versión sube en el mismo bloque. Se descartó envolverlo en una
  transacción: con el paso idempotente, un corte a mitad de camino se resuelve solo en la próxima
  apertura.
- **Constante `FORM_COLUMNS` con nombre y tipo.** Se descartó dejar los nombres repetidos en el SQL
  y en el filtro, porque un cambio en uno solo reintroduce el bug sin que nada lo avise.

## Supuestos

- `db.getAllAsync('PRAGMA table_info(agenda_visits)')` devuelve una fila por columna con el campo
  `name`. Es el comportamiento estándar de SQLite y de `expo-sqlite`, y el mismo `getAllAsync` ya se
  usa en `agendaRepository.ts`.
- Al correr el paso v4 la tabla `agenda_visits` existe siempre, porque la crea el paso 1, que corre
  antes en la misma apertura o en una anterior.
- Las columnas que ya existen tienen el tipo esperado (`TEXT` / `INTEGER`). SQLite tiene tipado
  dinámico, así que una diferencia de afinidad no rompe las lecturas ni escrituras actuales.

Ninguno es `RIESGO`.

## Cómo se prueba

- Tests unitarios en `agendaSchema.test.ts` con un doble de `SQLiteDatabase`:
  - versión 0 → ejecuta los 4 pasos y agrega las 3 columnas (criterio 3).
  - versión 1, 2 y 3 sin columnas → agrega las 3 y llega a 4 (criterio 3).
  - versión 2 o 3 con las 3 columnas → no hay `ALTER TABLE`, pero sí `PRAGMA user_version = 4`
    (criterios 2 y 3).
  - versión 3 con sólo `form_template_id` → agrega sólo las otras dos (criterios 1 y 2).
  - versión 4 → ni `execAsync` ni `getAllAsync` (criterio 4).
  - verificar que `getAllAsync` se llama con `PRAGMA table_info(agenda_visits)` (criterio 1).
- `node .agents/scripts/verificar.mjs --tarea PLAN-52` para lint, tipos y tests (criterio 6).
