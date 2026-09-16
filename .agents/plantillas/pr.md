# <CLAVE>: <título de la tarea>

> Plantilla del cuerpo del PR (fase 5). La usa `pr.mjs`.

**Issue:** [<CLAVE>](https://<sitio>.atlassian.net/browse/<CLAVE>)
**Spec:** `specs/<CLAVE>-<slug>/01-spec.md`

## Qué resuelve

> Dos o tres oraciones. El detalle está en la spec; acá va lo que necesita saber quien revisa.

## Criterios de aceptación

> Copiados de `01-spec.md`, como checklist, para que la revisión humana los tenga a mano.

- [ ]
- [ ]

## Verificación

| Gate | Resultado |
|---|---|
| | |

**Revisión independiente:** `<motor>` — veredicto `<verdict>`

> Qué motor revisó importa para saber cuánta independencia real hubo. Si dice `anfitriona`,
> la revisó la misma IA que implementó (con contexto limpio, pero misma familia de modelo):
> conviene mirar el diff con algo más de atención.

### Hallazgos no bloqueantes

> Los `medium` y `low` de la revisión. No frenan el merge, pero quedan registrados acá para
> que la decisión de ignorarlos sea de una persona y no un olvido.

-

---

> Sólo en tareas full-stack:
> **Depende de:** <URL del PR hermano>. Mergear el del backend primero.
