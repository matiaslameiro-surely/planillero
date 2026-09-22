# Tareas — PLAN-16

## frontend *(app móvil)*

- [x] `[frontend]` Crear `src/constants/layout.ts` con constantes ergonómicas (`MIN_TOUCH_TARGET = 48`, estilos base) y `src/constants/layout.test.ts`.
- [x] `[frontend]` Refactorizar `src/app/login.tsx` para garantizar `minHeight: 48` en inputs y botón, atributos de accesibilidad y alto contraste.
- [x] `[frontend]` Refactorizar `src/components/SignaturePad.tsx` para asegurar `minHeight: 48` en los botones de acción ("Limpiar trazo", "Cancelar", "Confirmar firma") y espaciado ergonómico.
- [x] `[frontend]` Refactorizar `src/app/evidence/[visitId].tsx` asegurando `minHeight: 48` en botones táctiles ("Agregar foto", "Firmar", "Subir evidencias", "Sellar manifiesto", "Verificar").
- [x] `[frontend]` Refactorizar `src/forms/DynamicForm.tsx` y campos (`FieldText`, `FieldNumber`, `FieldSelect`, `FieldMultiSelect`, `FieldBoolean`) para asegurar `minHeight: 48` en inputs, chips y botón de envío.
- [x] `[frontend]` Corregir `src/app/formulario.tsx` para leer parámetros con `useLocalSearchParams` nativo de Expo Router en lugar de `window.location`.
- [x] `[frontend]` Crear `src/components/__tests__/ergonomics.test.tsx` con pruebas unitarias para targets táctiles mínimos y accesibilidad.
- [x] `[frontend]` Elaborar el informe pericial de auditoría en `docs/AUDITORIA_UX_MOVIL.md` cubriendo las 10 heurísticas de Nielsen, evaluación ergonómica (targets >48dp, contraste solar, guantes/una mano) y registro de prueba con usuario real.

## Verificación

- [x] Gates en verde en frontend (`node .agents/scripts/verificar.mjs --tarea PLAN-16`)
- [x] Revisión independiente sin hallazgos `critical` ni `high`
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto
