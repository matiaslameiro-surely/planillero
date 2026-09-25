# PLAN-59 — Backoffice: Ajustar CSP para compilación JIT de Ajv y omitir validación en blur en modo readonly

## Contexto y problema

Al interactuar con formularios dinámicos en el Backoffice (por ejemplo, al hacer click o desenfocar campos de texto como observaciones), `ValidationService` invoca `this.ajv.compile(schema)`, el cual compila validadores optimizados en tiempo de ejecución generando código dinámico mediante `new Function(...)`.
En el entorno productivo / Docker, NGINX sirve la cabecera `Content-Security-Policy` con la directiva `script-src 'self'` sin autorizar `'unsafe-eval'`. Al dispararse la compilación de Ajv, el navegador bloquea la ejecución arrojando:
`EvalError: Evaluating a string as JavaScript violates the following Content Security Policy directive because 'unsafe-eval' is not an allowed source of script: script-src 'self'`.

Adicionalmente, en la pantalla de Expediente digital (`mode="readonly"`), cuando el usuario hace click o desenfoca un control del formulario histórico, el método `onBlur()` de `DynamicFormComponent` actualmente dispara la validación de campo y muta las señales de error y campos tocados (`touched`), lo cual es innecesario e inconsistente para registros históricos inmutables de solo lectura.

## Alcance

**Repos que toca:** `backoffice`

## Criterios de aceptación

1. En `backoffice/docker/nginx.conf`, incorporar `'unsafe-eval'` a la directiva `script-src` de la cabecera `Content-Security-Policy`.
2. En `DynamicFormComponent.onBlur()`, verificar si `this.isReadonly()` es verdadero para salir inmediatamente sin invocar la validación de campo (`ValidationService.validateField`) ni mutar señales de error ni de campos tocados.
3. Actualizar la guardia de configuración de NGINX (`nginx-guard.spec.ts`) y agregar pruebas unitarias para `DynamicFormComponent` que garanticen que en modo `readonly` los eventos de blur no ejecutan validaciones ni modifican señales de error / tocados.
4. Mantener todos los gates determinísticos de verificación en verde (`npm test`, `npm run lint`, `npm run build` en `backoffice`).

## Fuera de alcance

- Modificar la lógica interna de validación ni los esquemas de validación de `ValidationService`.
- Alterar el comportamiento de validación y presentación en modo `edit`.
- Cambios en los repositorios de `backend`, `frontend` o `harness`.

## Preguntas abiertas

Ninguna.
