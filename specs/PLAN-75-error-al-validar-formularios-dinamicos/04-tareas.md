# Tareas — PLAN-75

Sin backend: el contrato no cambia (el backend ya emite Draft 2020-12), así que no hay `03-contrato-api.md`.

## frontend *(app móvil)*

- [x] `[frontend]` Importar `Ajv` desde `ajv/dist/2020` en `src/forms/validation.ts`
- [x] `[frontend]` Test `src/forms/validation.test.ts` con schema 2020-12: válido, inválido y por campo

## backoffice *(web)*

- [x] `[backoffice]` Importar `Ajv` desde `ajv/dist/2020` en `validation.service.ts`
- [x] `[backoffice]` Test `__tests__/validation.service.spec.ts` con el mismo caso

## Verificación

- [ ] Gates en verde en los repos del alcance (`node .agents/scripts/verificar.mjs`)
- [ ] Revisión independiente sin hallazgos `critical` ni `high`
- [ ] Cada criterio de aceptación de `01-spec.md` queda cubierto
