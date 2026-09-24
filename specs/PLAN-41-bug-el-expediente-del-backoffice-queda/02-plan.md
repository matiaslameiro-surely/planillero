# Plan técnico — PLAN-41

## Enfoque

Pasar el estado de `ExpedienteComponent` a signals, que es el patrón del resto de la app, y leerlos
como signals en el template. `loadExpediente()` sigue siendo asíncrono: sólo cambia cómo guarda el
resultado. Primero se escribe el spec y se confirma que falla con el código actual.

## Archivos a tocar

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/pages/expediente/expediente.component.ts` | modificar | `loading`, `visit`, `formSchema` y `error` pasan a `signal()`, y el template los lee como `loading()` y `visit()`. `getStatusClass()` lee el signal |
| `src/app/pages/expediente/expediente.spec.ts` | crear | Casos: carga correcta, error de la API, formulario en solo lectura y sin ID |

## Decisiones técnicas

- **Signals en lugar de `ChangeDetectorRef.markForCheck()`.** Marcar a mano también funcionaría, pero
  deja el componente distinto del resto y es fácil de olvidar en la próxima asignación. Los signals
  son el patrón que usan todas las demás pantallas.
- **En el template, `@if (visit(); as v)`.** Así el resto del template sigue leyendo `v.code` y
  compañía, y el diff queda chico.

## Supuestos

- En el test alcanza con esperar a que se resuelvan las promesas (`await fixture.whenStable()`) para
  reproducir el comportamiento del navegador. Con el código actual, la vista sigue en «Cargando...»
  aunque los datos ya llegaron.

## Cómo se prueba

1. Spec nuevo, primero contra el código actual (los casos 1 y 2 tienen que fallar) y después con el
   arreglo.
2. `node .agents/scripts/verificar.mjs --tarea PLAN-41`.
3. En el entorno local: reconstruir el backoffice y abrir `/expediente/a0000001-…-000000000001`.
