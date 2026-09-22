# Plan técnico — PLAN-18

## Enfoque

Una auditoría heurística vale lo que valen sus evidencias. La decisión que ordena todo el resto es
que **cada afirmación del informe se sostiene sobre una cita `archivo:línea` del repo**, no sobre una
impresión visual. Eso hace el informe reproducible (cualquiera abre el archivo y ve lo mismo),
verificable en la revisión, y estable frente a cambios de datos de prueba.

El trabajo tiene tres partes:

1. **Barrido heurístico.** Recorrer las ocho pantallas contra las cinco heurísticas del issue,
   leyendo los `.html`, `.scss` y los `.ts` con template y estilos embebidos. La exploración ya se
   hizo: los templates de las ocho rutas, `_variables.scss`, `styles.scss`, los cinco componentes de
   campo y `dynamic-form.component.ts`.

2. **Contraste medido, no estimado.** Los ratios WCAG se calculan con un script en vez de a ojo. El
   script es de un solo uso: corre desde el scratchpad y sus resultados se copian al informe. No se
   versiona una herramienta descartable. La fórmula es la de WCAG 2.1 (luminancia relativa con la
   corrección sRGB).

3. **Layout de oficina.** Revisar `max-width`, `grid-template-columns`, breakpoints y `font-size`
   contra un viewport de 1920x1080, que es el escenario que el issue nombra.

El informe se escribe en `backoffice/docs/auditoria-ux-ui.md`: vive junto al código que audita, y así
las citas `archivo:línea` quedan relativas a su propio repo.

**Lo que ya se ve del barrido preliminar** (se confirma y se cuantifica en la fase 3):

- La paleta de tokens de `_variables.scss` está prácticamente abandonada. Conviven al menos tres
  escalas de color distintas: los tokens propios (`#208aef`), una escala tipo Tailwind slate/blue en
  `evidence-viewer` y `supervision` (`#2563eb`, `#64748b`, `#0284c7`), y una tipo Chakra gray en los
  formularios (`#718096`, `#2b6cb0`, `#e53e3e`). El azul primario tiene tres valores distintos.
- Hay tipografías por debajo del umbral de legibilidad de escritorio: `0.65rem` (10,4 px) en los
  badges de supervisión, `9px` en `.hash-box`, `10px` en `.type-badge`, `11px` en `.status-pill`.
- No existe navegación global: `app.html` es sólo `<router-outlet />`. Cada pantalla resuelve el
  regreso con su propio enlace ad-hoc, con textos diferentes («Volver al inicio», «Volver al Panel»),
  y `expediente` y `supervision` directamente no tienen ninguno.
- Las acciones de efecto masivo no piden confirmación: «Asignar seleccionadas (N)» dispara la
  asignación sin diálogo previo ni deshacer.
- `src/index.html` declara `lang="en"` con toda la interfaz en español.

## Archivos a tocar

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `docs/auditoria-ux-ui.md` | crear | El informe completo: resumen ejecutivo, las cinco heurísticas, contraste, layout 1080p y tabla de hallazgos priorizados |

### Repo del harness (fuera del PR del backoffice)

| Archivo | Acción | Para qué |
|---|---|---|
| `specs/PLAN-18-.../01-spec.md`, `02-plan.md`, `04-tareas.md`, `estado.json` | crear y actualizar | Artefactos del protocolo |

**Un solo archivo de producto.** Muy por debajo del límite de 12 de `workspace.json`.

## Decisiones técnicas

- **El informe se versiona en `backoffice/docs/`.** Se descartó dejarlo sólo en
  `specs/PLAN-18-.../` del harness porque ese repo no se comparte con quien mantiene el backoffice,
  y las citas `archivo:línea` sólo se pueden seguir desde el repo auditado. Se descartó Confluence
  porque el informe envejece con el código y tiene que moverse con él.
- **Evidencia por cita de código, no por captura.** Se descartaron las capturas de pantalla porque
  exigen levantar backoffice y backend con datos sembrados, y una captura no dice *dónde* arreglarlo.
  Si la rúbrica pide imágenes, se agregan sobre el mismo informe sin rehacerlo.
- **Contraste calculado por script, no estimado a ojo.** Se descartó usar una herramienta web (no hay
  acceso garantizado y no deja traza reproducible) y se descartó estimar, que es exactamente el error
  que una auditoría no puede cometer. Al informe va la tabla de resultados con la fórmula citada, que
  es lo que se puede reauditar.
- **Severidad por impacto operativo, no por cantidad de píxeles.** Un badge ilegible en el tablero de
  supervisión, que es la pantalla de decisión en tiempo real, pesa más que el mismo badge en una
  pantalla de consulta. La escala (`crítica`/`alta`/`media`/`baja`) se define explícitamente en el
  informe para que la priorización sea discutible y no arbitraria.
- **Las cinco heurísticas del issue se barren en forma sistemática; las otras cinco, por
  oportunidad.** Se descartó auditar las diez porque el issue pide «al menos 5» y nombra cuáles;
  extender el barrido completo duplicaría el informe sin agregar a lo pedido. Los hallazgos que
  aparezcan bajo las otras se registran igual, marcados como tales.

## Contrato de API

No aplica: el alcance es un solo repo y la tarea no toca endpoints.

## Supuestos

- La paleta declarada en `src/app/styles/_variables.scss` **es** la paleta institucional. No hay
  manual de marca en ningún repo. Si apareciera uno distinto, la sección de paleta se revalida, pero
  los hallazgos de *incoherencia interna* (tres azules primarios distintos) siguen valiendo con
  cualquier paleta de referencia.
- El escenario de uso es **navegador de escritorio a 1920x1080 con zoom 100 %**, que es lo que el
  issue llama «pantallas de 1080p+ de oficina». El backoffice no se audita en móvil: para eso está la
  app.
- El informe es el entregable **final** de la tarea: no se corrige nada del código en este PR. Si el
  usuario decide lo contrario en el checkpoint, cambian el alcance y el plan.
- El fondo de página efectivo es blanco. `src/styles.scss` no fija un `background` en `body`, así que
  se toma el default del navegador; los ratios se calculan contra `#ffffff` y ese supuesto queda
  escrito en el informe.

Ninguno marcado `RIESGO`: si alguno falla, se corrige una sección del informe, no el enfoque.

## Cómo se prueba

- `node .agents/scripts/verificar.mjs --tarea PLAN-18` — lint, build (tipos) y tests del backoffice
  en verde. El informe no toca código, así que el aporte del gate es confirmar que no se rompió nada.
- **Cada cita se verifica**: recorrer el informe y comprobar que todo `archivo:línea` existe y dice lo
  que el hallazgo afirma. Es la prueba que de verdad importa acá: un informe con una cita rota no vale
  nada.
- **Recuento contra los criterios de aceptación**: las cinco heurísticas tienen sección y veredicto;
  las ocho pantallas aparecen; cada hallazgo tiene los seis campos obligatorios; están las secciones
  de contraste, de 1080p y el resumen ejecutivo.
- Los ratios de contraste se recalculan una segunda vez sobre los valores ya copiados al informe, para
  descartar un error de transcripción.
