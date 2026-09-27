# Plan técnico — PLAN-68

## Enfoque

Que `requierenAtencion` se arme por **motivo explícito** y no por la combinación `accion === 'ninguna'`:
sólo entran los resultados cuyo motivo pide una decisión humana (`working_tree_sucio`,
`rama_con_trabajo`). El resultado de `--solo-revisar` para un repo sano gana un `detalle` que dice si está
al día o cuántos commits le faltan, y la lista usa `detalle ?? motivo` como red de seguridad para que
nunca imprima `undefined`.

## Archivos a tocar

### harness

| Archivo | Acción | Para qué |
|---|---|---|
| `.agents/scripts/sincronizar.mjs` | modificar | Motivos que requieren atención y `detalle` de `solo_revisar` |

## Decisiones técnicas

- **Lista explícita de motivos** — Se descartó sólo agregar `&& r.motivo !== 'solo_revisar'` a la
  condición actual: sigue dependiendo de que ningún motivo nuevo con `accion: 'ninguna'` sea benigno. Con
  la lista, un motivo nuevo no entra a `requierenAtencion` salvo que alguien lo decida.
- **Un repo detrás de la base no requiere atención en `--solo-revisar`** — Se descartó listarlo: es
  exactamente lo que la sincronización real resuelve sola. Se informa en `detalle`.

## Supuestos

Ninguno.

## Cómo se prueba

El harness no tiene gates (`verificar.mjs` responde `sin_gates`). Se prueba a mano con los repos del
workspace en tres situaciones reales: un repo limpio en `main` al día, un repo en una rama de tarea con
commits propios y el harness con specs sin commitear, corriendo con y sin `--solo-revisar`. Las salidas
quedan en `06-verificacion-manual.md`.
