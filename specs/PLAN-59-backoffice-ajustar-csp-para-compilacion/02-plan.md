# Plan técnico — PLAN-59

## Enfoque

La solución aborda dos frentes complementarios en el `backoffice`:

1. **Ajuste de CSP en NGINX (`backoffice/docker/nginx.conf`)**:
   Se incorpora `'unsafe-eval'` a la directiva `script-src` de la cabecera `Content-Security-Policy`. Esto permite la compilación de esquemas JIT de Ajv (`this.ajv.compile(schema)`) que genera funciones de validación dinámicas en tiempo de ejecución (`new Function(...)`) sin disparar `EvalError` en los entornos de producción bajo Docker/NGINX.

2. **Omisión de validación onBlur en modo `readonly` (`DynamicFormComponent`)**:
   En `DynamicFormComponent.onBlur(name: string)`, se añade una comprobación temprana `if (this.isReadonly()) { return; }`. De este modo, en el modo de solo lectura (como el visor de expediente digital), los eventos de pérdida de foco no invocan `ValidationService.validateField()` ni mutan las señales de `touched` o `errors`.

3. **Pruebas y guardias**:
   - Se actualiza `nginx-guard.spec.ts` para verificar que la cabecera CSP contiene `script-src 'self' 'unsafe-eval'`.
   - Se agrega una suite de pruebas unitarias `backoffice/src/app/forms/__tests__/dynamic-form.component.spec.ts` para validar el comportamiento de `onBlur()` tanto en modo `readonly` (sin efectos colaterales ni llamadas a validación) como en modo `edit` (marcado de touched y validación de campo).

## Archivos a tocar

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `docker/nginx.conf` | modificar | Incorporar `'unsafe-eval'` a `script-src` en la cabecera `Content-Security-Policy`. |
| `src/app/forms/dynamic-form.component.ts` | modificar | Salir temprano en `onBlur` si `isReadonly()` es verdadero. |
| `src/app/core/__tests__/nginx-guard.spec.ts` | modificar | Añadir aserción de guardia para CSP con `'unsafe-eval'`. |
| `src/app/forms/__tests__/dynamic-form.component.spec.ts` | crear | Pruebas unitarias para `DynamicFormComponent` validando `onBlur` en modo `readonly` vs `edit`. |

## Decisiones técnicas

- **Habilitar `'unsafe-eval'` en `script-src` vs usar pre-compilación AOT de esquemas**:
  Se descartó precompilar esquemas porque los formularios en Planillero son plantillas dinámicas descargadas en tiempo de ejecución desde la API (`FormsApiService`), por lo que Ajv necesita compilar esquemas arbitrarios dinámicamente en el cliente.
- **Guardia `isReadonly()` en `onBlur`**:
  Se descartó deshabilitar los eventos blur a nivel de directivas de campo en el template HTML porque la responsabilidad de manejar el estado del formulario y la validación reside de forma centralizada en `DynamicFormComponent`.

## Supuestos

Ninguno.

## Cómo se prueba

1. **Guardia de NGINX**: Ejecución de `npm test` en `backoffice` corriendo `nginx-guard.spec.ts` validando la directiva CSP.
2. **Pruebas unitarias de DynamicFormComponent**: Verificación con `npm test` en `backoffice` evaluando que al disparar blur en `readonly` no se mutan los signals `touched` ni `errors` y no se invoca `validateField`.
3. **Gates globales**: Ejecución de `node .agents/scripts/verificar.mjs --tarea PLAN-59` para validar lint, build de tipos y tests en verde.
