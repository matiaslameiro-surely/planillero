# Tareas — PLAN-52

## frontend *(app móvil)*

- [x] `[frontend]` Declarar `FORM_COLUMNS` (nombre y tipo) en `src/db/agendaSchema.ts`
- [x] `[frontend]` Paso v4: leer `PRAGMA table_info(agenda_visits)` y agregar sólo las columnas que falten, con el `PRAGMA user_version = 4` en el mismo `execAsync`
- [x] `[frontend]` Documentar en el comentario del paso por qué este paso publicado sí se edita
- [x] `[frontend]` Tests: el doble suma `getAllAsync`, más los casos «ya tiene todas», «ya tiene algunas» y «v4 no consulta nada»

## Verificación

- [x] Gates en verde en los repos del alcance (`node .agents/scripts/verificar.mjs`)
- [x] Revisión independiente sin hallazgos `critical` ni `high`
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto
