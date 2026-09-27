# PLAN-80 — Backoffice: las fotos del visor de evidencias no se muestran (401 al pedir la imagen)

## Contexto y problema

En el visor de evidencias (`/evidence/:visitId`), las tarjetas muestran únicamente el nombre del archivo y metadatos: las imágenes no cargan ni en la miniatura de la tarjeta ni en el modal de inspección pericial. En la consola del navegador se observan errores HTTP 401 (`Unauthorized`) por cada petición de imagen.

La causa es que las etiquetas `<img [src]="getFileUrl(...)">` delegan la petición directamente al navegador, saltándose el cliente `HttpClient` de Angular y, por ende, el interceptor de autenticación que inyecta la cabecera `Authorization: Bearer <token>`. Como los endpoints de descarga de archivos de evidencias (`GET /api/v1/visits/:visitId/evidences/:evidenceId/file`) requieren autenticación, el backend responde 401.

Para resolverlo, el visor debe solicitar los binarios a través de `HttpClient` con `responseType: 'blob'`, generar URLs locales de objeto (`URL.createObjectURL`) para el renderizado seguro en el DOM, revocar oportunamente dichos recursos (`URL.revokeObjectURL`) para evitar fugas de memoria al destruir el componente o cambiar de visita, y mostrar un aviso amigable cuando un archivo falle al cargar. Asimismo, se debe permitir el esquema `blob:` en la directiva `img-src` de la política CSP en Nginx.

## Alcance

**Repos que toca:** `backoffice`

## Criterios de aceptación

1. **Carga autenticada de binarios:** Las fotos y firmas de las evidencias se solicitan mediante `HttpClient` incluyendo el token de autenticación.
2. **Visualización en tarjeta y modal:** Las imágenes se renderizan correctamente mediante URLs `blob:` tanto en las tarjetas de la grilla como en el modal de inspección pericial.
3. **Manejo de errores:** Si la descarga de un archivo de evidencia falla o responde con error, la tarjeta muestra un estado/aviso de error en lugar de una imagen rota o bloqueada.
4. **Liberación de memoria:** Todas las URLs de objeto (`blob:`) creadas se liberan con `URL.revokeObjectURL` al destruir el componente (`ngOnDestroy`) y al recargar/cambiar de visita.
5. **Configuración CSP:** La directiva `img-src` en `backoffice/docker/nginx.conf` incluye el esquema `blob:`, sin incorporar `unsafe-*` ni debilitar otras directivas.
6. **Cobertura de tests:** Se incluyen pruebas unitarias en `evidence.service.spec.ts`, `evidence-viewer.spec.ts` y `nginx-guard.spec.ts` cubriendo la obtención de blobs, el manejo de éxito y error de carga en el componente, y la directiva CSP.

## Fuera de alcance

- Modificaciones en endpoints del backend (no se implementan URLs firmadas temporales ni cambios de contrato en la API).
- Modificaciones en la aplicación móvil `frontend`.
- Cambios de diseño en la navegación o estructura general del visor (el acceso desde el expediente corresponde a PLAN-79).

## Preguntas abiertas

Ninguna.
