# PLAN-78 — Error de integridad al subir evidencias: hash SHA-256 del cliente no coincide con el del servidor

## Contexto y problema

Al tocar «Subir y almacenar evidencias» en la pantalla de custodia de evidencias del móvil, el backend
rechaza la subida con «Discrepancia de integridad: el hash SHA-256 declarado por el cliente (…) no
coincide con el calculado por el servidor (…)». El servidor calcula el hash sobre los bytes del archivo
que recibe en el multipart y lo compara con el que el cliente declara en `X-Content-SHA256`.

El issue atribuye la diferencia a que `TextEncoder` y el `Blob` codificarían distinto el SVG. Al revisar
el código se encontró una causa más concreta, y la solución que propone el issue no se puede aplicar tal
cual:

- **La firma nunca puede coincidir.** `SignaturePad` calcula el hash sobre el SVG (`svgContent`), pero lo
  que entrega para subir es `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`, y la pantalla sube
  ese texto. Se hashea una cosa y se sube otra.
- **La foto de muestra** hashea y sube el mismo string, así que en ese caso los bytes coinciden (tanto
  `TextEncoder` como el `fetch` de Expo, que arma el multipart leyendo el `Blob`, usan UTF-8). Pero lo que
  sube tampoco es una imagen: es el texto de un data URI.
- **Lo que queda guardado no es un SVG válido.** En los dos casos el archivo que llega al almacenamiento
  WORM es un texto que empieza con `data:image/svg+xml;utf8,`, declarado como `image/svg+xml`. El visor de
  evidencias del backoffice no lo puede mostrar como imagen.
- **`blob.arrayBuffer()` no existe en el `Blob` de React Native 0.86** (la versión que trae Expo 57), así
  que la solución propuesta en el issue fallaría en el dispositivo con «arrayBuffer is not a function».

## Alcance

**Repos que toca:** `frontend` (móvil)

## Criterios de aceptación

1. Para fotos y firmas, el hash que el cliente declara en `X-Content-SHA256` es el SHA-256 de los mismos
   bytes que viajan en la parte `file` del multipart.
2. Lo que se sube es el SVG en sí (el archivo empieza con `<svg`), con tipo `image/svg+xml`; no un data URI.
3. El hash se sigue calculando al capturar la evidencia (es el que se muestra en pantalla antes de subir),
   y la subida usa exactamente el contenido que se hasheó: no hay un segundo string que pueda divergir.
4. La solución no depende de `Blob.arrayBuffer()` ni de construir un `Blob` desde bytes, que el `Blob` de
   React Native no soporta.
5. `SignaturePad` no pierde el último trazo cuando el último movimiento y el soltar el dedo se procesan
   en el mismo lote de React (encontrado al escribir los tests: el updater leía una ref que el release ya
   había vaciado, y la firma subida quedaba sin ese trazo).
6. Hay tests automatizados que verifican el criterio 1 para una foto y para una firma (comparando contra
   el SHA-256 calculado de forma independiente sobre el contenido subido), el criterio 2 y el criterio 5.

## Fuera de alcance

- Captura real de fotos con la cámara: la «foto» sigue siendo una imagen SVG de muestra.
- Cambios en el backend: la validación del servidor es correcta.
- Las evidencias ya guardadas con el formato anterior (data URI): no se migran.

## Preguntas abiertas

- [x] `NO-BLOQUEANTE` ¿Hay evidencias subidas con el formato anterior que haya que corregir? Como la firma
  nunca pudo subirse y la foto de muestra es de prueba, se asume que no hay datos reales afectados.
