# Plan técnico — PLAN-73

## Enfoque

Abordar las tres mejoras menores detectadas en el backoffice de manera quirúrgica y limpia, manteniendo consistencia visual y de comportamiento:

1. **Mensaje de login ante servidor caído:** En `src/app/pages/login/login.ts`, actualizar `messageOf(error)` para que, cuando se reciba un `HttpErrorResponse` sin `message` explícito en el cuerpo y cuyo código sea 0 (falla de red/CORS/backend apagado), 502 (Bad Gateway), 503 (Service Unavailable) o 504 (Gateway Timeout), retorne `«No se puede conectar con el servidor. Probá de nuevo en unos minutos.»` en lugar de un código de error técnico. Crear `login.spec.ts` para cubrir la pantalla de login y sus mensajes de error.
2. **Atajo Enter en Auditoría:** En `src/app/pages/auditoria/auditoria.html`, añadir el listener `(keydown.enter)="verifyIntegrity()"` en el `<input>` de búsqueda de visita. Añadir test unitario en `auditoria.spec.ts`.
3. **Contención de desborde horizontal en celular:** En `src/app/pages/auditoria/auditoria.scss` y `src/app/pages/planificacion/planificacion.scss`, aplicar `overflow-x: auto` y `max-width: 100%` a las clases `.auditoria__grid` y `.planificacion__grid`. Incorporar en `layout-guard.spec.ts` la comprobación de scroll horizontal contenido para evitar regresiones de desborde a 390px.

## Archivos a tocar

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/pages/login/login.ts` | modificar | Devolver mensaje amigable sin códigos técnicos ante fallas de conexión o servidor no disponible (0, 502, 503, 504) |
| `src/app/pages/login/__tests__/login.spec.ts` | crear | Tests unitarios de pantalla de login y verificación de mensajes de error técnicos y amigables |
| `src/app/pages/auditoria/auditoria.html` | modificar | Disparar `verifyIntegrity()` al presionar `Enter` en el input de visita |
| `src/app/pages/auditoria/auditoria.spec.ts` | modificar | Test unitario para verificar la acción al presionar `Enter` |
| `src/app/pages/auditoria/auditoria.scss` | modificar | Añadir `overflow-x: auto; max-width: 100%;` a `.auditoria__grid` |
| `src/app/pages/planificacion/planificacion.scss` | modificar | Añadir `overflow-x: auto; max-width: 100%;` a `.planificacion__grid` |
| `src/app/styles/__tests__/layout-guard.spec.ts` | modificar | Validar que las grillas principales posean contención de scroll horizontal |

## Decisiones técnicas

- **Mapeo de códigos de error de indisponibilidad (0, 502, 503, 504) en lugar de ocultar todos los códigos:** Se descartó ocultar el código en *todos* los errores desconocidos porque errores como 403 o 409 sin mensaje pueden requerir diagnóstico, mientras que 0, 502, 503 y 504 representan de forma certera la caída o inaccesibilidad del backend.
- **Scroll horizontal en el contenedor `.grid` en vez de envolver la tabla en un `<div>` extra:** Se descartó agregar elementos DOM wrappers porque tanto en `auditoria` como en `planificacion`, el contenedor semántico de la tabla es directamente `.auditoria__grid` y `.planificacion__grid`, permitiendo resolver el scroll directamente vía SCSS sin alterar la jerarquía de componentes ni romper selectores de test existentes.

## Supuestos

- Ninguno.

## Cómo se prueba

1. `npm test` en `backoffice` ejecutando la suite completa de Vitest (incluyendo `login.spec.ts`, `auditoria.spec.ts` y `layout-guard.spec.ts`).
2. `npm run lint` y `npm run build` en `backoffice` para asegurar tipado y estándares de código sin advertencias.
