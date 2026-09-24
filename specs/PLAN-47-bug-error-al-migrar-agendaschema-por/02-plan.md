# Plan técnico — PLAN-47

## Enfoque

El problema ocurre porque al migrar una base de datos desde `version = 0`, el código en `frontend/src/db/agendaSchema.ts` ejecuta tanto el bloque `version < 2` como `version < 4`, intentando agregar las columnas `form_template_id`, `form_template_version` y `form_submitted_at` dos veces a la tabla `agenda_visits`.

La solución consiste en:
1. Eliminar las sentencias `ALTER TABLE agenda_visits ADD COLUMN ...` del bloque `if (version < 2)` en `frontend/src/db/agendaSchema.ts`, dejando únicamente la creación de la tabla `visit_audit_traces` en ese paso.
2. Mantener la incorporación de las columnas de formulario en el bloque `if (version < 4)`.
3. Crear la suite de tests unitarios `frontend/src/db/agendaSchema.test.ts` para verificar la ejecución de migraciones incrementales partiendo desde las versiones 0, 1, 2, 3 y 4.

## Archivos a tocar

### frontend/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/db/agendaSchema.ts` | modificar | Remover sentencias `ALTER TABLE` duplicadas en el bloque `version < 2` |
| `src/db/agendaSchema.test.ts` | crear | Tests unitarios de migración incremental para validar v0 -> v4, v1 -> v4, v2 -> v4, v3 -> v4 y v4 |

## Decisiones técnicas

- **Eliminar `ALTER TABLE` de v2 en lugar de v4** — Se descartó modificar v4 porque v4 fue introducido específicamente para agregar las columnas a bases que ya habían migrado a v2 o v3. Dejar las columnas en v4 asegura que una base en v0, v1, v2 o v3 llegue coherentemente a v4 sin duplicación.

## Supuestos

- Ninguno.

## Cómo se prueba

1. Ejecución de tests unitarios de frontend con `npm test -- src/db/agendaSchema.test.ts`.
2. Ejecución completa de gates automáticos de frontend: `npm run lint`, `npx tsc --noEmit`, `npm test`.
