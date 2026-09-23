# PLAN-39 — Tres hojas de estilo de componente exceden el presupuesto de 4 kB del build

## Contexto y problema

Al compilar el backoffice (`npm run build`), el proceso termina exitosamente pero emite tres advertencias de presupuesto (`budgets` en `angular.json` para `anyComponentStyle`), debido a que tres hojas de estilo de componente superan el límite de advertencia de 4 kB:
- `src/app/pages/supervision/supervision.scss`: ~6,79 kB (excede por ~2,79 kB).
- `src/app/pages/evidence-viewer/evidence-viewer.scss`: ~5,80 kB (excede por ~1,80 kB).
- `src/app/pages/planificacion/planificacion.scss`: ~4,50 kB (excede por ~504 bytes).

El presupuesto original de 4 kB por componente se estableció cuando las pantallas eran meros esqueletos iniciales. Con el avance del desarrollo (supervisión con KPIs y estados en tiempo real, visor de evidencias con peritajes y lightbox, y planificación con asignación de rutas y confirmación modal), las pantallas crecieron con estilos legítimos y necesarios.

Asimismo, existe duplicación estilística en la implementación del patrón de modal / overlay entre el visor de evidencias (`evidence-viewer`) y el diálogo de confirmación de planificación (`planificacion`). La solución consiste en abordar ambos aspectos: extraer y unificar el patrón de modal a estilos compartidos para eliminar código duplicado, y elevar el presupuesto de `anyComponentStyle` en `angular.json` a un valor coherente con pantallas reales de backoffice, documentando el cálculo en la configuración.

## Alcance

**Repos que toca:** `backoffice`

## Criterios de aceptación

1. El build del backoffice (`npm run build`) finaliza en verde sin emitir advertencias de presupuesto (`exceeded maximum budget`).
2. Se extrae el patrón común de modal / overlay a estilos compartidos (e.g. en `src/app/styles/_modal.scss` o `src/styles.scss`), de manera que el modal de `evidence-viewer` y la confirmación de `planificacion` compartan la misma base estructural.
3. El diseño, apariencia visual y comportamiento de las pantallas (`supervision`, `evidence-viewer` y `planificacion`) se mantienen idénticos a los existentes.
4. El presupuesto `anyComponentStyle` en `angular.json` (en configuraciones `production` y `docker`) se ajusta a un valor justificado en función del tamaño de la pantalla más compleja (`supervision.scss`), documentado mediante comentario explicativo.
5. Todos los gates de verificación del backoffice (`npm run lint`, `npm run build`, `npm test`) pasan en verde.

## Fuera de alcance

- Refactorizaciones estructurales de HTML o lógica de negocio/TypeScript de los componentes más allá de la vinculación de estilos del modal.
- Cambios en los repositorios `backend`, `frontend` o `harness`.

## Preguntas abiertas

Ninguna.
