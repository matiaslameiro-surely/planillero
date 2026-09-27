# Tareas — PLAN-74

## frontend *(app móvil)*

- [x] `[frontend]` Crear la rama `PLAN-74-excluir-archivos-de-test-del-bundle-de` con `ramas.mjs crear`
- [x] `[frontend]` `git mv src/app/login.test.tsx src/__tests__/app/login.test.tsx`
- [x] `[frontend]` `git mv src/app/__tests__/agenda.test.tsx src/__tests__/app/agenda.test.tsx`
- [x] `[frontend]` `git mv src/app/__tests__/agendaSafeArea.test.tsx src/__tests__/app/agendaSafeArea.test.tsx`
- [x] `[frontend]` Confirmar que `src/app/` no quedó con ningún archivo ni carpeta de test
- [x] `[frontend]` Crear `src/__tests__/app/routerDirectory.test.ts`: recorre `src/app/` y falla si
      encuentra `*.test.*`, `*.spec.*`, o carpetas `__tests__/` o `__mocks__/`
- [x] `[frontend]` Correr `npm test` y confirmar que los 33 archivos previos más el nuevo pasan
      (baseline: 33 archivos, 286 tests)
- [x] `[frontend]` Correr `npx tsc --noEmit` y `npm run lint`
- [x] `[frontend]` Regenerar el árbol de rutas y confirmar que `href` ya no contiene rutas de test,
      y que el log del dev server no registra `Property 'jest' doesn't exist`
- [x] `[frontend]` Probar el test de regresión en contra: agregar un `src/app/__probe.test.ts` temporal,
      confirmar que el test falla, y borrarlo
- [x] `[frontend]` Commit `PLAN-74: …` y registrar el SHA

## Verificación

- [x] Gates en verde (`node .agents/scripts/verificar.mjs --tarea PLAN-74`)
- [x] Revisión independiente sin hallazgos `critical` ni `high`
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto
