# Tareas — PLAN-4

## backoffice

- [ ] `[backoffice]` Generar el proyecto con `ng new` (Angular 22, SCSS, sin SSR)
- [ ] `[backoffice]` Corregir el gate de tests en `workspace.json`: Angular 22 usa Vitest, no Karma
- [ ] `[backoffice]` Quitar el requisito de Chrome del README del harness (ya no aplica)
- [ ] `[backoffice]` Agregar ESLint con `@angular-eslint` y el script `lint` con warnings que fallan
- [ ] `[backoffice]` Crear la estructura de carpetas de `base-frontend` (`core/`, `shared/`, `pages/`, `environments/`, `styles/`)
- [ ] `[backoffice]` Configurar entornos con `fileReplacements` en `angular.json`
- [ ] `[backoffice]` Implementar `salud.model.ts` y `salud.service.ts` con `HttpClient`
- [ ] `[backoffice]` Registrar `provideHttpClient()` en `app.config.ts`
- [ ] `[backoffice]` Implementar los tests del servicio con `HttpTestingController`
- [ ] `[backoffice]` Implementar la pantalla `pages/inicio/` con los tres estados y su ruta
- [ ] `[backoffice]` Agregar `.gitignore` y `.gitattributes`
- [ ] `[backoffice]` Actualizar el `README.md` del repo

## Verificación

- [ ] `npm ci` desde un clon limpio, sin errores
- [ ] `npm run lint`, `npm run build` y `npm test` en verde
- [ ] Prueba negativa en los dos gates (tests y lint)
- [ ] `node .agents/scripts/verificar.mjs --tarea PLAN-4` corre los tres gates en verde
- [ ] Prueba de contrato contra el backend de PLAN-2 levantado en local
- [ ] Revisión independiente sin hallazgos `critical` ni `high`
- [ ] Los 10 criterios de aceptación de `01-spec.md` quedan cubiertos
