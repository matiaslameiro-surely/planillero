# Plan técnico — PLAN-77

## Enfoque

1. **Backend** (Completado):
   - Eliminar el escape con `HtmlUtils.htmlEscape` al guardar en `recordHeartbeat` y al devolver en `getOperatorsStatus`.
   - Test de integración en `SupervisionIntegrationTest`.

2. **Backoffice**:
   - Crear función utilitaria pura `escapeHtml(value: string | null | undefined): string` en `src/app/core/utils/escape-html.ts` que convierte `&`, `<`, `>`, `"`, `'` en sus respectivas entidades HTML seguras.
   - Test unitario exhaustivo para `escapeHtml`.
   - En `supervision-map.ts`, aplicar `escapeHtml` sobre todas las variables de usuario interpoladas en la plantilla string de Leaflet popup (`observations`, `username`, `activeVisitCode`, `networkStatus`, `status`).
   - Crear `supervision-map.spec.ts` para verificar la inicialización de Leaflet y que el contenido del popup escape HTML arbitrario (ej. `<b id="inyectado">`, `<a href="...">`).
   - En `route-map.ts`, aplicar `escapeHtml` sobre `visit.code`, `visit.urgency` y `visit.address`.
   - Actualizar `route-map.spec.ts` para validar el comportamiento seguro del popup.

## Archivos a tocar

### backend/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/main/java/ar/com/planillero/supervision/SupervisionService.java` | modificar | Quitar `HtmlUtils.htmlEscape` en guardado y lectura de observaciones |
| `src/test/java/ar/com/planillero/supervision/SupervisionIntegrationTest.java` | modificar | Agregar tests de integración para verificar ida y vuelta con caracteres especiales y acentos |

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/core/utils/escape-html.ts` | crear | Helper reutilizable para escapar caracteres especiales HTML |
| `src/app/core/utils/escape-html.spec.ts` | crear | Tests unitarios de `escapeHtml` |
| `src/app/pages/supervision/supervision-map/supervision-map.ts` | modificar | Escapar variables interpoladas en el popup del mapa de supervisión |
| `src/app/pages/supervision/supervision-map/supervision-map.spec.ts` | crear | Tests unitarios para el componente del mapa y escape de popup |
| `src/app/pages/planificacion/route-map/route-map.ts` | modificar | Escapar variables interpoladas en el popup del mapa de rutas |
| `src/app/pages/planificacion/route-map/route-map.spec.ts` | modificar | Tests de verificación de escape en popup |

## Decisiones técnicas

- **Crear helper `escapeHtml` dedicado en lugar de depender de dependencias externas** — Se optó por una función liviana y pura (`escape-html.ts`) que no agrega dependencias adicionales a `node_modules` ni requiere librerías pesadas en el bundle del navegador.
- **Escapar a nivel de presentación en componentes Leaflet** — Dado que Leaflet requiere construir popups como cadenas HTML crudas o elementos DOM, el escape explícito en la plantilla asegura consistencia con el resto de la aplicación (donde Angular previene XSS de manera nativa en sus templates).

## Supuestos

- `Ninguno`

## Cómo se prueba

1. Ejecutar tests del backend: `mvnw test`
2. Ejecutar build y tests del backoffice: `npm run build` y `npm test`
3. Verificar que `supervision-map.spec.ts` valida que observaciones con HTML no son interpretadas como etiquetas.
