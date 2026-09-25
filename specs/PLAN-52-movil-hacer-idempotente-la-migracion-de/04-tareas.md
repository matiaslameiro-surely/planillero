# Tareas — PLAN-52

## frontend *(app móvil)*

- [x] `[frontend]` Declarar `FORM_COLUMNS` (nombre y tipo) en `src/db/agendaSchema.ts`
- [x] `[frontend]` Paso v4: leer `PRAGMA table_info(agenda_visits)` y agregar sólo las columnas que falten, con el `PRAGMA user_version = 4` en el mismo `execAsync`
- [x] `[frontend]` Documentar en el comentario del paso por qué este paso publicado sí se edita
- [x] `[frontend]` Tests: el doble suma `getAllAsync`, más los casos «ya tiene todas», «ya tiene algunas» y «v4 no consulta nada»

- [x] `[frontend]` Tests de integración contra SQLite real (`node:sqlite`) que reproducen el bug con el código anterior
- [x] `[frontend]` Declarar Node 22.13+ en `engines` y `.nvmrc`; la suite falla en vez de saltearse con un Node anterior

## harness

- [x] `[harness]` `init.mjs --check` valida el rango del equipo (22.22.3+ o 24.15+, sin Node 23)
- [x] `[harness]` `AGENTS.md`: requisito de entorno alineado con el `README.md`

## Verificación

- [ ] Gates en verde en los repos del alcance (`node .agents/scripts/verificar.mjs`)
- [ ] Revisión independiente sin hallazgos `critical` ni `high`
- [ ] Cada criterio de aceptación de `01-spec.md` queda cubierto
