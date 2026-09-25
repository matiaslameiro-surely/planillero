# Plan técnico — PLAN-63

## Enfoque

Una función común traduce el error HTTP de una visita a un mensaje para la pantalla, y las dos
pantallas la usan:

```ts
visitAccessMessage(error: unknown): string | null
// 403 → «No tenés acceso a esta visita.»
// 404 → «La visita no existe.»
// otro → null (cada pantalla decide su mensaje genérico)
```

- **Expediente:** el `catch` usa la función (o el mensaje genérico) y deja de hacer `console.error`.
  El estado de error suma el link «← Volver a planificación».
- **Visor:** nuevo signal `accessError`. Lo llena el error de `/evidences`. Si está, el template
  muestra el mensaje debajo del encabezado (que ya tiene «← Volver al Panel») y oculta el panel de
  custodia y la lista. En `/manifest`, sólo un `404` con `manifest_not_found` deja «Pendiente de
  sellado»; otro error no se disfraza de pendiente. El error de `/formulario` (título) sigue sin
  afectar nada.

## Archivos a tocar

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/core/http/visit-access.ts` | crear | `visitAccessMessage(error)` |
| `src/app/core/http/visit-access.spec.ts` | crear | 403, 404 y otros errores |
| `src/app/pages/expediente/expediente.component.ts` | modificar | Mensaje por status, link de volver, sin `console.error` |
| `src/app/pages/expediente/expediente.spec.ts` | modificar | Casos 403, 404 y genérico |
| `src/app/pages/evidence-viewer/evidence-viewer.ts` | modificar | `accessError` desde `/evidences`; manifiesto pendiente sólo con `manifest_not_found` |
| `src/app/pages/evidence-viewer/evidence-viewer.html` | modificar | Estado de error en lugar del panel y la lista |
| `src/app/pages/evidence-viewer/evidence-viewer.spec.ts` | modificar | Casos 403, 404, operador con 403 del título, pendiente de sellado |

Total: 7 archivos.

## Decisiones técnicas

- **`/evidences` decide el acceso en el visor.** Es el único de los tres pedidos que responden los
  tres roles; su `403` es siempre por jurisdicción o asignación (PLAN-49).
- **Por status y no por código de error**, salvo `manifest_not_found`. Los `403` de PLAN-49 tienen
  dos códigos (`outside_jurisdiction`, `visit_not_assigned`) y para la pantalla significan lo mismo.
- **Función común en `core/http`**, no un servicio: no tiene estado y así se testea sola.

## Supuestos

- `/manifest` de una visita accesible sin manifiesto responde `404` con
  `error: "manifest_not_found"` (PLAN-51, verificado en `ManifestService`).
- `/evidences` de una visita inexistente responde `404 visit_not_found`, y de una visita ajena,
  `403` (PLAN-49, verificado en local el 25/09).

## Cómo se prueba

1. Tests unitarios de la función y de las dos pantallas.
2. `node .agents/scripts/verificar.mjs --tarea PLAN-63`.
3. En local con Chrome headless: `/evidence` y `/expediente` de V-2001 (zona sur) y de un UUID
   inexistente como `supervisor.demo`, y V-1006 accesible sin manifiesto (sigue «Pendiente de
   sellado»).
