# Plan técnico — PLAN-67

## Enfoque

Resolver los problemas de contraste y adaptabilidad a temas (claro y oscuro) detectados en `LocationSummary` y `SyncQueueBanner` dentro de `frontend`:

1. **`LocationSummary`**:
   - Integrar `useThemeColors()` para obtener los tokens de color del tema activo del dispositivo.
   - Envolver el contenedor con el borde dinámico temático `colors.borderDefault` (reemplazando el gris estático `#8888`).
   - Aplicar `colors.textSecondary` a todos los textos de fila (`latitud`, `longitud`, `precisión` e `inicio`). Con `textSecondary` (`#334155` en claro y `#cbd5e1` en oscuro), el contraste contra `bgSurface` (`#ffffff` en claro y `#1e293b` en oscuro) supera ampliamente los 9.0:1, cumpliendo holgadamente el mínimo WCAG 2.1 AA (>= 4.5:1).
   
2. **`SyncQueueBanner`**:
   - Cambiar el color de fondo de `styles.done` de `#1a9e5c` a `#15803d` (equivalente a `LIGHT_THEME.success`, como se realizó en PLAN-57 para el chip de estado). Sobre este fondo, el texto blanco `#fff` (`doneText`) alcanza una relación de contraste de 5.02:1, superando el mínimo requerido de 4.5:1.

3. **Pruebas de contraste y temas**:
   - Extender `LocationSummary.test.tsx` para evaluar renderizado en tema claro (`light`) y tema oscuro (`dark`), validando que el borde y los textos usen los tokens correspondientes y que el contraste calculado mediante `contrastRatio` contra el fondo de la tarjeta (`bgSurface`) sea >= 4.5:1.
   - Extender `SyncQueueBanner.test.tsx` con pruebas que certifiquen que la relación de contraste entre el texto `doneText` y el fondo `done` sea >= 4.5:1.

## Archivos a tocar

### frontend/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/components/LocationSummary.tsx` | modificar | Consumir `useThemeColors()`, aplicar `borderDefault` al contenedor y `textSecondary` a los textos. |
| `src/components/SyncQueueBanner.tsx` | modificar | Actualizar el color de fondo en `styles.done` a `#15803d` para garantizar contraste WCAG AA con texto blanco. |
| `src/components/LocationSummary.test.tsx` | modificar | Agregar pruebas de contraste WCAG 2.1 AA por tema (claro/oscuro) con `contrastRatio`. |
| `src/components/SyncQueueBanner.test.tsx` | modificar | Agregar prueba de contraste WCAG 2.1 AA para el cartel de «Todo sincronizado». |

## Decisiones técnicas

- **Usar `colors.textSecondary` para los textos en `LocationSummary`** — Se descartó usar `colors.textPrimary` porque en la jerarquía visual de `VisitCard`, el código de visita es el título principal (`textPrimary`), mientras que los metadatos secundarios (dirección, resumen de ubicación técnica) se estilizan con `textSecondary`, manteniendo coherencia visual y superando holgadamente el contraste de 4.5:1 (da ~10:1 en claro y ~9.8:1 en oscuro).
- **Usar `#15803d` (`LIGHT_THEME.success`) fijo para el banner de sincronización** — Se descartó hacer el fondo dependiente del tema en `SyncQueueBanner` porque el banner es un estado de alerta/confirmación con texto blanco fijo `#fff`. `DARK_THEME.success` (`#22c55e`) con texto blanco da un contraste insuficiente (~2.3:1), mientras que `#15803d` garantiza 5.02:1 en cualquier modo, alineándose exactamente a la decisión tomada en PLAN-57 con el chip `modeOnline`.

## Supuestos

Ninguno. El comportamiento de los tokens de color y la librería de contraste de PLAN-57 están plenamente operativos.

## Cómo se prueba

1. Pruebas unitarias de frontend con Jest:
   `npm test -- src/components/LocationSummary.test.tsx src/components/SyncQueueBanner.test.tsx`
2. Chequeo de tipos estáticos de TypeScript:
   `npx tsc --noEmit`
3. Linter:
   `npm run lint`
4. Suite completa de verificación del harness:
   `node .agents/scripts/verificar.mjs --tarea PLAN-67`
