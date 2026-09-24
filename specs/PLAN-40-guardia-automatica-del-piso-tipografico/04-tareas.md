# Tareas — PLAN-40

## backoffice *(web)*

- [x] `[backoffice]` Crear `src/app/styles/__tests__/typography-guard.spec.ts` con la lógica de escaneo estático de hojas de estilo (`.scss`) y estilos embebidos (`.ts`), validación de piso tipográfico y control de `opacity`.
- [x] `[backoffice]` Incluir en la suite casos de prueba unitarios que validen la detección de infracciones (`< 12px`, `< 0.75rem`, `opacity` sin justificar) y la aceptación de casos válidos / excepciones justificadas.
- [x] `[backoffice]` Documentar con comentarios `/* allow-opacity: ... */` las excepciones legítimas existentes en `navbar.scss` y `field-boolean.component.ts`.

## Verificación

- [x] Gates en verde en los repos del alcance (`node .agents/scripts/verificar.mjs`)
- [x] Revisión independiente sin hallazgos `critical` ni `high`
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto
