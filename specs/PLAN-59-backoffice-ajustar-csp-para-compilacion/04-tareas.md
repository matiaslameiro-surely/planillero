# Tareas — PLAN-59

## backoffice *(web)*

- [x] `[backoffice]` Incorporar `'unsafe-eval'` a la directiva `script-src` de `Content-Security-Policy` en `backoffice/docker/nginx.conf`.
- [x] `[backoffice]` Añadir guardia `if (this.isReadonly()) return;` en `DynamicFormComponent.onBlur()` en `backoffice/src/app/forms/dynamic-form.component.ts`.
- [x] `[backoffice]` Actualizar guardia de configuración NGINX en `backoffice/src/app/core/__tests__/nginx-guard.spec.ts` para verificar la directiva CSP.
- [x] `[backoffice]` Crear pruebas unitarias para `DynamicFormComponent` en `backoffice/src/app/forms/__tests__/dynamic-form.component.spec.ts`.

## Verificación

- [x] Gates en verde en los repos del alcance (`node .agents/scripts/verificar.mjs --tarea PLAN-59`)
- [x] Revisión independiente sin hallazgos `critical` ni `high`
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto
