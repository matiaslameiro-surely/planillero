# Tareas — PLAN-73

## backoffice *(web)*

- [x] `[backoffice]` Modificar `src/app/pages/login/login.ts` para mostrar mensaje amigable sin códigos técnicos ante status 0, 502, 503, 504.
- [x] `[backoffice]` Crear `src/app/pages/login/__tests__/login.spec.ts` con cobertura de casos de error en login.
- [x] `[backoffice]` Modificar `src/app/pages/auditoria/auditoria.html` agregando `(keydown.enter)="verifyIntegrity()"` en el input de visita.
- [x] `[backoffice]` Modificar `src/app/pages/auditoria/auditoria.spec.ts` con test para el evento Enter.
- [x] `[backoffice]` Modificar `src/app/pages/auditoria/auditoria.scss` y `src/app/pages/planificacion/planificacion.scss` para habilitar `overflow-x: auto; max-width: 100%;` en sus grillas.
- [x] `[backoffice]` Modificar `src/app/styles/__tests__/layout-guard.spec.ts` para asegurar la protección contra desbordes en grillas de datos.

## Verificación

- [x] Gates en verde en el repo backoffice (`node .agents/scripts/verificar.mjs`)
- [x] Revisión independiente sin hallazgos `critical` ni `high`
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto
