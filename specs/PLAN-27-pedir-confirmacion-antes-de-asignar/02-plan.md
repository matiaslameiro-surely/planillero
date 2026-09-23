# Plan técnico — PLAN-27

## Enfoque

La decisión que ordena todo lo demás: **la confirmación no es un `window.confirm()` ni un componente
de terceros, sino un panel en el propio template de planificación, gobernado por una señal con la
asignación pendiente**. Así el texto puede nombrar operador, fecha y cantidad —que es justamente lo
que el hallazgo H12 pide— y el mismo camino sirve para las dos formas de asignar: `assignSelected()`
y `assignSingle()` dejan de llamar a `assign()` y pasan a llenar `pendingAssignment`; `assign()` se
vuelve privado y sólo lo dispara el botón de confirmar. No queda ninguna ruta que asigne sin pasar
por ahí, que es lo que hace verificable el criterio 1.

Sacar la preselección es quitar tres líneas de `loadOperators()`. El valor vacío del desplegable ya
existe y ya significa «sin filtro de operador»; lo único que cambia es la etiqueta, que pasa a decir
que hay que elegir a alguien, y el `[disabled]` de los botones, que ya contempla
`!selectedOperatorId()`. No hace falta un estado nuevo.

La accesibilidad del modal (H15) se resuelve con una **directiva `appFocusTrap` compartida**, no con
código pegado en cada pantalla. El visor de evidencias y el nuevo panel de confirmación tienen el
mismo problema —dar foco al abrir, atrapar Tab, escuchar Escape a nivel del contenedor y devolver el
foco al cerrar—, así que se escribe una sola vez en `shared/directives/` y se aplica en los dos
lugares. La directiva emite `escape` en vez de cerrar por su cuenta: quién cierra y cómo es del
componente.

Para la fecha pasada (H13) van las dos capas que pide el criterio 3: `min` en el input, igual que los
filtros de auditoría usan `min`/`max`, y una advertencia dentro de la confirmación, porque `min` sólo
disuade en el selector del navegador y no frena un valor tecleado ni una fecha que se volvió pasada
con la pantalla abierta.

## Archivos a tocar

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/shared/directives/focus-trap.ts` | crear | Directiva `appFocusTrap`: foco al abrir, trampa de Tab, evento `escape`, retorno de foco al destruirse |
| `src/app/shared/directives/__tests__/focus-trap.spec.ts` | crear | Tests de la directiva en aislamiento (foco inicial, ciclo de Tab, retorno) |
| `src/app/pages/planificacion/planificacion.ts` | modificar | Sacar la autoselección; `pendingAssignment`, `confirmAssignment()`, `cancelAssignment()`; `minDate`; detección de fecha pasada |
| `src/app/pages/planificacion/planificacion.html` | modificar | Opción «Elegí un operador», `[min]` en la fecha, panel de confirmación con la directiva |
| `src/app/pages/planificacion/planificacion.scss` | modificar | Estilos del panel de confirmación y de su advertencia |
| `src/app/pages/planificacion/planificacion.spec.ts` | modificar | Ajustar los tests que asumen preselección; sumar los de confirmación, cancelación y fecha pasada |
| `src/app/pages/evidence-viewer/evidence-viewer.html` | modificar | Aplicar `appFocusTrap` al modal y colgar de ahí el Escape |
| `src/app/pages/evidence-viewer/evidence-viewer.spec.ts` | crear | Test del foco al abrir, Escape y retorno de foco a la tarjeta |

**Total: 8 archivos** (3 creados, 5 modificados). Debajo del límite de 12 de `workspace.json`.

### backend/ y frontend/

No se tocan.

## Decisiones técnicas

- **Panel de confirmación propio en el template, gobernado por una señal.** Se descartó
  `window.confirm()` porque bloquea el hilo, no se puede testear sin espiar el `window`, no se puede
  estilar y no permite destacar la advertencia de fecha pasada. Se descartó también un componente
  genérico de diálogo en `shared/components/` porque hoy habría un solo consumidor real: lo que sí
  se comparte entre las dos pantallas es el comportamiento de foco, y eso queda en la directiva.
- **`<div role="dialog" aria-modal="true">` en vez del `<dialog>` nativo.** El elemento nativo daría
  trampa de foco y Escape gratis, pero su soporte en jsdom es parcial e inestable y los gates del
  backoffice corren los tests en jsdom, no en un navegador. Además el visor de evidencias ya usa un
  overlay con `role="dialog"`: dos mecanismos distintos de modal en la misma app cuestan más que uno
  imperfecto.
- **La directiva emite `escape` en vez de cerrar sola.** Se descartó que cerrara el modal por su
  cuenta (buscando un `close()` del anfitrión) porque ataría la directiva a la forma del componente;
  emitir el evento la deja usable tanto por el visor —que limpia una señal— como por la
  confirmación, que además tiene que dejar la selección intacta.
- **`assign()` pasa a ser privado y sin llamadores directos desde el template.** Se descartó dejar
  ambos caminos —confirmar o asignar directo según el caso— porque la acción rápida de fila es
  exactamente el clic barato que el hallazgo señala: si queda sin confirmar, el criterio 1 se cumple
  a medias y el riesgo sigue.
- **`min` en el input *más* advertencia en la confirmación.** Se descartó bloquear duro la fecha
  pasada (impedir la asignación) porque asignar en una fecha ya transcurrida es legítimo al
  regularizar trabajo ya hecho; lo que el issue llama error de tipeo se ataja avisando, no
  prohibiendo.
- **La advertencia vive en la confirmación y no como cartel suelto.** Se descartó un aviso permanente
  junto al campo de fecha porque compite con el resto de la pantalla y se aprende a ignorar; en la
  confirmación aparece en el único momento en que importa.

## Contrato de API

No aplica: el alcance es un solo repo y no se toca ningún endpoint.

## Supuestos

- Los botones de asignar ya contemplan `!selectedOperatorId()` en su `[disabled]`, así que quitar la
  preselección alcanza para que arranquen deshabilitados. Verificado en `planificacion.html:56` y
  `:118`.
- El valor vacío del desplegable de operador se puede seguir usando como «sin filtro» para la grilla
  sin romper nada: `reloadVisits()` ya trata `''` como `undefined` y omite `date` en ese caso.
  Verificado en `planificacion.ts`, `reloadVisits()`.
- jsdom 28 entrega `HTMLElement.focus()` y `document.activeElement` con fidelidad suficiente para
  testear la directiva. Es lo que hace que los tests de foco sean posibles; si no se cumple, los
  criterios 4 y 5 se verifican a mano y el test se reduce a comprobar los atributos ARIA.
- El backend acepta asignaciones con fecha pasada. Si las rechazara, la advertencia seguiría siendo
  correcta pero sobraría: no cambia el plan, sólo el texto.
- Nadie más está tocando `planificacion.*` ni `evidence-viewer.*` en este sprint. PLAN-28 (tokens de
  diseño del backoffice) y PLAN-30 (jerarquía informativa del tablero y el visor) están asignadas a
  otras personas y **ambas pueden rozar estos archivos**; PLAN-30 nombra el visor explícitamente. Se
  asume que ninguna de las dos está en curso todavía —las dos figuran en «Por hacer»—, y que los
  conflictos, si aparecen, se resuelven en el PR.

Ninguno marcado `RIESGO`: ninguno, si resulta falso, invalida el enfoque.

## Cómo se prueba

- `node .agents/scripts/verificar.mjs --tarea PLAN-27` corre lint, build (que además valida los
  templates) y los tests con Vitest sobre jsdom.
- Tests automatizados nuevos, uno por criterio verificable:
  - la pantalla arranca sin operador elegido y con los botones de asignar deshabilitados (criterio 2);
  - marcar visitas y presionar «Asignar seleccionadas» **no** llama al servicio y abre la
    confirmación con el nombre del operador, la fecha y la cantidad (criterio 1);
  - cancelar no llama al servicio y deja la selección como estaba (criterio 1);
  - confirmar llama al servicio con los mismos parámetros de antes (criterio 1, no regresión);
  - la acción rápida de fila pasa por la misma confirmación (criterio 1);
  - con una fecha anterior a hoy, la confirmación muestra la advertencia (criterio 3);
  - el input de fecha expone `min` con el día de hoy (criterio 3);
  - el modal del visor recibe el foco al abrirse, Escape lo cierra y el foco vuelve a la tarjeta
    (criterio 4).
- A mano, en `npm start`: recorrer el modal con Tab y comprobar que el foco no se escapa al fondo, y
  que el desplegable de operador no viene con nadie elegido al entrar a la pantalla.
