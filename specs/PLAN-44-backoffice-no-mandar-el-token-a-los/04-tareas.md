# Tareas — PLAN-44

## backoffice *(web)*

- [x] `[backoffice]` Excluir endpoints públicos (`/salud`, `/health`, rutas de login y refresh) del envío del Bearer en `src/app/core/interceptors/auth.interceptor.ts`.
- [x] `[backoffice]` Implementar decodificación del claim `exp` de JWT y chequeo de margen de expiración (<= 30 segundos) en `src/app/core/interceptors/auth.interceptor.ts`.
- [x] `[backoffice]` Integrar la renovación proactiva vía `AuthService.refresh()` antes de enviar peticiones protegidas cuando el token esté por expirar o expirado.
- [x] `[backoffice]` Asegurar la preservación del manejo reactivo de error 401 como red de seguridad.
- [x] `[backoffice]` Actualizar y extender la suite de pruebas unitarias en `src/app/core/interceptors/__tests__/auth.interceptor.spec.ts` para cubrir todos los criterios de aceptación.

## Verificación

- [x] Gates en verde en el repo backoffice (`node .agents/scripts/verificar.mjs --tarea PLAN-44`)
- [x] Revisión independiente sin hallazgos `critical` ni `high`
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto
