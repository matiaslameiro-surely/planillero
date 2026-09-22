# PLAN-18 — Auditoría UX/UI Web: Evaluación Heurísticas de Nielsen en Backoffice Angular

## Contexto y problema

El backoffice web (`planillero-backoffice`, Angular 22) es la herramienta del **supervisor central**:
desde ahí se planifican rutas, se monitorea el turno en vivo, se audita la cadena de integridad y se
inspeccionan las evidencias digitales de cada visita. Creció por acumulación de tareas
(PLAN-4 el esqueleto, PLAN-6 el login, PLAN-10 el visor de evidencias, PLAN-11 la auditoría, PLAN-12
el tablero de supervisión, PLAN-13 el expediente), cada una con su propio criterio visual y sin que
nadie mirara el conjunto.

El Sprint 4 es de cierre y demo, y la Sección 5 de la rúbrica pide una autoevaluación de experiencia
de usuario. Esta tarea es esa mirada al conjunto: una **auditoría heurística formal** que deje por
escrito qué funciona, qué no, y con qué evidencia se afirma cada cosa.

El issue es específico en los entregables (heurísticas a cubrir, legibilidad, paleta, evidencias),
pero **no dice dónde vive el informe** ni si la tarea incluye remediar lo que encuentre. Ver
Preguntas abiertas.

## Alcance

**Repos que toca:** `backoffice`

Es una tarea **documental**: produce un informe de auditoría, no funcionalidad. No hay contrato de
API involucrado, así que el backend no participa y la app móvil queda fuera (el issue acota
explícitamente a «entorno web de escritorio»).

Pantallas bajo auditoría — las ocho rutas que declara `src/app/app.routes.ts`:

| Ruta | Componente | Rol |
|---|---|---|
| `/login` | `Login` | anónimo |
| `/` | `Home` | autenticado |
| `/planificacion` | `Planificacion` | supervisor |
| `/supervision` | `Supervision` (+ `SupervisionMap`) | supervisor |
| `/auditoria` | `Auditoria` | administrador |
| `/evidence/:visitId` | `EvidenceViewer` | autenticado |
| `/expediente/:visitId` | `ExpedienteComponent` (+ formularios dinámicos) | supervisor |
| `/acceso-denegado` | `AccessDenied` | autenticado |

## Criterios de aceptación

1. Existe `docs/auditoria-ux-ui.md` en el repo `backoffice`, escrito en español.
2. El informe evalúa **las cinco heurísticas de Nielsen que nombra el issue** — visibilidad del
   estado del sistema, consistencia y estándares, prevención de errores, reconocimiento antes que
   recuerdo, y diseño estético y minimalista con foco en excepciones — cada una con su propia
   sección y un veredicto explícito.
3. Cada una de las ocho pantallas de la tabla de Alcance aparece evaluada bajo, como mínimo, las
   cinco heurísticas: ninguna queda sin revisar y ninguna heurística se declara «cumple» sin decir
   sobre qué pantallas se verificó.
4. Cada hallazgo lleva: identificador (`H<n>`), heurística violada, pantalla, **severidad**
   (`crítica` / `alta` / `media` / `baja`), **evidencia citable** en formato `archivo:línea` del
   repo `backoffice`, y recomendación concreta de remediación.
5. El informe incluye una sección de **legibilidad y paleta institucional** con la tabla de ratios
   de contraste (fórmula WCAG 2.1) de cada par texto/fondo efectivamente usado en la UI, y el
   veredicto AA (≥ 4.5:1 para texto normal, ≥ 3:1 para texto grande) de cada par.
6. El informe incluye una sección de **verificación en pantalla de oficina de 1080p+**, que revisa
   los `max-width`, grillas y breakpoints de los SCSS y dictamina si el layout aprovecha o
   desperdicia un viewport de 1920×1080.
7. El informe abre con un **resumen ejecutivo** con el conteo de hallazgos por severidad y las tres
   acciones de mayor impacto.
8. Los gates del backoffice (`node .agents/scripts/verificar.mjs --tarea PLAN-18`) quedan en verde.

## Fuera de alcance

- **Remediar los hallazgos.** Esta tarea los documenta y los prioriza; corregirlos es trabajo
  posterior, y mezclarlo acá haría que el informe describa una UI que el mismo PR ya cambió.
  Si el usuario lo pide en el checkpoint del plan, se amplía el alcance explícitamente.
- La app móvil (`frontend`) y el backend: el issue acota a entorno web de escritorio.
- Una auditoría de accesibilidad WCAG completa. Se cubre contraste y legibilidad, que es lo que el
  issue pide; lector de pantalla, orden de foco y navegación completa por teclado se mencionan como
  hallazgos si aparecen, pero no se audita sistemáticamente contra WCAG 2.1 AA entero.
- Las cinco heurísticas restantes de Nielsen (control y libertad del usuario, flexibilidad y
  eficiencia, ayuda a reconocer y recuperarse de errores, ayuda y documentación, correspondencia
  con el mundo real). Se registran los hallazgos que surjan, pero el barrido sistemático es sobre
  las cinco que el issue nombra — que es el mínimo que pide.
- Tests automatizados de UI o de regresión visual.

## Preguntas abiertas

- [ ] `NO-BLOQUEANTE` **¿Dónde vive el informe?** El issue dice «en el informe final de entrega»,
      que es un documento del proyecto externo a los repos. Se asume que el entregable versionable
      es `backoffice/docs/auditoria-ux-ui.md`, pensado para anexarse o citarse desde ese informe
      final. Si tiene que ir a otro lado (Confluence, el repo del harness), se mueve el archivo sin
      rehacer el contenido.
- [ ] `NO-BLOQUEANTE` **¿Qué cuenta como «evidencia»?** Se asume **evidencia citable en código**
      (`archivo:línea` del repo, más la ruta de la pantalla), que es reproducible y no envejece con
      un cambio de datos de prueba. Las capturas de pantalla exigirían levantar backoffice y backend
      con datos sembrados; si la rúbrica pide imágenes, se agregan después sobre el mismo informe.
- [ ] `NO-BLOQUEANTE` **¿Hay una paleta institucional definida fuera del código?** No aparece ningún
      manual de marca en los repos. Se toma como paleta institucional la declarada en
      `src/app/styles/_variables.scss`, y la auditoría verifica **coherencia interna**: qué colores
      se usan fuera de esos tokens. Si existe una paleta oficial, la sección se revalida contra ella.
