# Plan técnico — PLAN-39

## Enfoque

Abordamos la resolución combinando la extracción de duplicación genuina y el ajuste de la configuración de presupuestos en Angular:
1. **Extracción del patrón de modal compartido:** Actualmente `evidence-viewer` y `planificacion` replican la estructura y estilos básicos de modales overlay (posicionamiento fijo, z-index 1000, fondo semitransparente, contenedor centrado con bordes redondeados y fondo blanco). Extraemos estas definiciones a un módulo de estilos globales `src/app/styles/_modal.scss` importado en `src/styles.scss`. Al ser estilos globales, no se emiten en los bundles aislados de cada componente (evitando inflar el presupuesto `anyComponentStyle`).
2. **Adopción en componentes:** Refactorizamos `evidence-viewer` y `planificacion` para utilizar las clases base compartidas (`.app-modal-overlay`, `.app-modal-dialog`, `.app-modal-backdrop`, `.app-modal-close-btn`), manteniendo intactos sus estilos específicos (como el layout de 2 columnas del lightbox o el ancho y tipografía del diálogo de confirmación de asignación).
3. **Ajuste y justificación de presupuesto en `angular.json`:** La pantalla `supervision.scss` no posee modales y mide actualmente ~6,79 kB debido a la complejidad de KPIs, múltiples estados periciales y media queries para pantallas grandes. Por ende, fijar 4 kB era un valor anacrónico heredado de componentes esqueleto. Se actualiza el presupuesto `anyComponentStyle` en `angular.json` a `8kB` para advertencia (`maximumWarning`) y `12kB` para error (`maximumError`) en las configuraciones `production` y `docker`, justificándolo debidamente con un comentario en el archivo.

## Archivos a tocar

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/styles/_modal.scss` | crear | Definir las clases estructurales compartidas de overlay, modal dialog, backdrop y botón de cierre. |
| `src/styles.scss` | modificar | Incluir `@use 'app/styles/modal';` para que las clases de modal estén disponibles globalmente sin computar en el presupuesto de ningún componente. |
| `src/app/pages/evidence-viewer/evidence-viewer.html` | modificar | Incorporar clases compartidas al overlay y contenedor del modal. |
| `src/app/pages/evidence-viewer/evidence-viewer.scss` | modificar | Remover reglas duplicadas de overlay/modal y conservar sólo estilos específicos del visor. |
| `src/app/pages/planificacion/planificacion.html` | modificar | Incorporar clases compartidas al overlay y contenedor de confirmación. |
| `src/app/pages/planificacion/planificacion.scss` | modificar | Remover reglas duplicadas de overlay/confirm y conservar sólo estilos específicos de planificación. |
| `angular.json` | modificar | Elevar `maximumWarning` a `8kB` y `maximumError` a `12kB` en `anyComponentStyle` (en `production` y `docker`), documentando la justificación con un comentario. |

## Decisiones técnicas

- **Estilos de modal en `src/styles.scss` (global) en lugar de mixins SCSS en cada componente:** Se descartó el uso de mixins o `@extend` dentro de los archivos `.scss` de los componentes porque al compilarse se duplicaría el CSS emitido dentro de cada componente, inflando el tamaño individual que mide la métrica `anyComponentStyle`. Las clases globales en `styles.scss` evitan la duplicación tanto en código fuente como en el bundle final.
- **Presupuesto de 8 kB warning / 12 kB error:** Se descartó un valor arbitrariamente alto (ej. 20 kB) o mantener 4 kB forzando reducciones cosméticas de 36 bytes. 8 kB otorga un margen seguro (~18% sobre los 6,79 kB de `supervision.scss`) para pantallas densas de administración sin descuidar la vigilancia de componentes desmedidos.
- **Mantener nombres de clases existentes y sumar clases compartidas en HTML:** Se descartó renombrar todas las clases existentes en los componentes para no romper potenciales referencias ni los tests de `focus-trap` o `evidence-viewer` (que buscan `.lightbox-overlay`, `[role="dialog"]`, `.close-btn`).

## Supuestos

- **Compatibilidad de comentarios en `angular.json`:** Angular CLI utiliza internamente el parser JSONC (con soporte de comentarios de bloque y de línea) para leer `angular.json`. Esto permite justificar el presupuesto directamente dentro del archivo sin alterar el build.
- **Estabilidad visual:** El aspecto visual de los modales y componentes permanecerá exactamente igual tras la extracción de las propiedades comunes.

## Cómo se prueba

1. Ejecución de `npm run build` en `backoffice`: debe compilar exitosamente sin ninguna advertencia de `exceeded maximum budget`.
2. Ejecución de la suite completa de tests (`npm test`): los 106 tests unitarios (incluyendo los de `evidence-viewer`, `focus-trap` y `planificacion`) deben pasar al 100%.
3. Ejecución de linter (`npm run lint`): sin advertencias ni errores.
4. Inspección visual del modal de evidencia y del diálogo de confirmación de planificación para validar que conservan idéntico diseño, centrado y comportamiento.
