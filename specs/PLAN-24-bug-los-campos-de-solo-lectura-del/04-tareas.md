# Tareas — PLAN-24

Checklist en **orden de dependencia**: el alcance es `backoffice` únicamente, así que no hay
backend ni contrato de API que emitir.

## backoffice *(web)*

- [x] `[backoffice]` Corregir `:readonly` → `:read-only` en `src/app/forms/fields/field-text.component.ts:46`
- [x] `[backoffice]` Corregir `:readonly` → `:read-only` en `src/app/forms/fields/field-number.component.ts:48`
- [x] `[backoffice]` Crear rama `PLAN-24-bug-los-campos-de-solo-lectura-del` y commit `44c5d74`

## Verificación

- [x] Gates en verde en `backoffice` (lint, build-tipos, tests)
- [x] Revisión independiente sin hallazgos `critical` ni `high` (approve, 0 hallazgos, motor anfitriona)
- [x] Criterio 1 de `01-spec.md`: los campos readonly del expediente se distinguen visualmente
- [x] Criterio 2 de `01-spec.md`: cubre `field-text` y `field-number`
- [x] Criterio 3 de `01-spec.md`: gates del backoffice en verde