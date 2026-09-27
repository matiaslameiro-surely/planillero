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
5. *(Agregado al atender la revisión.)* `--solo-revisar` anticipa bien la sincronización real: mide la
   rama base **local** (que es la que se actualiza), y si divergió de origin marca el repo en
   `requierenAtencion` con motivo `base_divergente`. Si no se puede comparar con la base remota, el repo
   sale con `ok: false` y motivo `rama_base_no_disponible`, con el error de git, en vez de afirmar que
   está al día.

## Fuera de alcance

- Cambiar qué hace `sincronizar.mjs` sin `--solo-revisar`. **Excepción deliberada:** el chequeo de
  `rama_base_no_disponible` también corre sin `--solo-revisar`. Antes ese caso intentaba el checkout o el
  pull igual y fallaba más adelante, a veces después de cambiar de rama; ahora frena antes sin tocar nada.
- Agregar una infraestructura de tests al harness.

## Preguntas abiertas

Ninguna.
