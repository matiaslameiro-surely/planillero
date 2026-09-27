# PLAN-68 — Harness: sincronizar.mjs --solo-revisar marca repos sanos en requierenAtencion

## Contexto y problema

`node .agents/scripts/sincronizar.mjs --solo-revisar` lista en `requierenAtencion` todos los repos, aunque
estén limpios y al día, y cada entrada dice `"<repo>: undefined"`.

La lista se arma con `r.ok && r.motivo && r.accion === 'ninguna'`. En modo `--solo-revisar` todo repo que
no tiene problemas termina con `accion: 'ninguna'` y `motivo: 'solo_revisar'`, así que entra en la lista,
y como ese resultado no tiene `detalle`, el texto sale `undefined`. El protocolo dice que si algo aparece
en `requierenAtencion` hay que parar y preguntar: un falso positivo en esa lista frena el flujo sin motivo.

## Alcance

**Repos que toca:** `harness`

## Criterios de aceptación

1. Con `--solo-revisar`, un repo limpio y al día no aparece en `requierenAtencion`.
2. Un repo con cambios sin commitear o en una rama con commits propios sí aparece, con su detalle, con y
   sin `--solo-revisar`.
3. Ninguna entrada de `requierenAtencion` dice `undefined`.
4. Con `--solo-revisar`, el resultado de un repo sano informa en `detalle` si está detrás de la rama base,
   para que se sepa qué haría la sincronización real.

## Fuera de alcance

- Cambiar qué hace `sincronizar.mjs` sin `--solo-revisar`.
- Agregar una infraestructura de tests al harness.

## Preguntas abiertas

Ninguna.
