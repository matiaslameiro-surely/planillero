# Plan técnico — PLAN-80

## Enfoque

El problema actual radica en que las imágenes de evidencias se referencian directamente mediante URLs HTTP ordinarias en `<img [src]="...">`. El navegador solicita estos recursos de forma nativa sin cabeceras `Authorization`, provocando respuestas HTTP 401 por parte del backend.

Para solucionar esto de manera segura y limpia en la SPA de Angular:
1. Se incorpora en `EvidenceService` el método `getEvidenceFileBlob(visitId, evidenceId): Observable<Blob>` que utiliza `HttpClient` con `responseType: 'blob'`. `HttpClient` pasa por el interceptor `auth.interceptor.ts`, enviando el Bearer token automáticamente.
2. En `EvidenceViewer`, al cargar la lista de evidencias, se descarga el binario de cada una en segundo plano. Al recibir el `Blob`, se genera una URL local mediante `URL.createObjectURL(blob)` y se almacena en un estado reactivo.
3. Se implementa `OnDestroy` en `EvidenceViewer` para liberar todas las URLs creadas mediante `URL.revokeObjectURL(url)` al destruir el componente o cambiar de visita, evitando fugas de memoria.
4. En la plantilla HTML (`evidence-viewer.html`), se manejan tres estados para la visualización del archivo (cargando, cargado con URL de objeto, y mensaje de error accesible en caso de fallo de red/permiso).
5. En `backoffice/docker/nginx.conf`, se agrega `blob:` a la directiva `img-src` de la Content Security Policy (CSP).

## Archivos a tocar

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/core/services/evidence.service.ts` | modificar | Agregar método `getEvidenceFileBlob` con `responseType: 'blob'` |
| `src/app/pages/evidence-viewer/evidence-viewer.ts` | modificar | Descargar blobs de evidencias, administrar `createObjectURL`/`revokeObjectURL` y ciclo de vida `OnDestroy` |
| `src/app/pages/evidence-viewer/evidence-viewer.html` | modificar | Renderizar imágenes con URLs blob y mostrar estado de error en tarjetas y modal |
| `src/app/pages/evidence-viewer/evidence-viewer.scss` | modificar | Estilos para contenedores de carga y error de imagen |
| `docker/nginx.conf` | modificar | Permitir `blob:` en la directiva `img-src` de la CSP |
| `src/app/core/services/__tests__/evidence.service.spec.ts` | modificar | Test unitario para `getEvidenceFileBlob` |
| `src/app/pages/evidence-viewer/evidence-viewer.spec.ts` | modificar | Tests unitarios de carga de imágenes blob, manejo de error y revocación al desmontar |
| `src/app/core/__tests__/nginx-guard.spec.ts` | modificar | Test de guardia para CSP con soporte `blob:` |

## Decisiones técnicas

- **Uso de Blobs + `URL.createObjectURL` en el cliente** — Se descartó la alternativa de tokens en query params o URLs firmadas temporales emitidas por backend porque implicaría modificar contratos y endpoints en el backend con mayor complejidad y riesgo de seguridad al exponer tokens en URLs del historial o logs. El patrón `HttpClient(blob)` + `createObjectURL` encapsula la solución por completo en el cliente respetando los estándares de seguridad vigentes.
- **Gestión centralizada de URLs en un Map reactivo con revocación en `OnDestroy`** — Se descartó usar un pipe impuro asíncrono porque dificultaría la revocación determinística de memoria (`revokeObjectURL`) y la sincronización con el modal ampliado. Con el componente gestionando el mapa de URLs, la liberación al desmontar o recargar es directa y garantizada.

## Supuestos

Ninguno.

## Cómo se prueba

1. Ejecución de la suite de tests unitarios del backoffice: `npm test` en `backoffice/`.
2. Verificación de gates determinísticos con `node .agents/scripts/verificar.mjs --tarea PLAN-80`.
3. Verificación de que el guardia de Nginx y los tests de `EvidenceViewer` cubren la carga exitosa (200), el error de descarga (401/404/500), y la revocación de Object URLs.
