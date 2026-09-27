# Plan técnico — PLAN-78

## Enfoque

Hacer que el hash y los bytes subidos salgan, por construcción, del mismo string. Se agrega en
`src/api/evidence.ts` un tipo `SvgEvidence` (`content`, `sha256`, `size`) con dos funciones:

- `prepareSvgEvidence(svg)`: hashea el markup del SVG al capturar (UTF-8) y devuelve el borrador.
- `uploadSvgEvidence(visitId, evidence, type, options)`: arma el `Blob` desde `evidence.content` y declara
  `evidence.sha256`. Nadie más construye el `Blob` ni elige el hash.

`SignaturePad` entrega un `SvgEvidence` en vez de `{ dataUri, sha256 }`, y la pantalla de evidencias usa
`prepareSvgEvidence` para la foto de muestra (con el markup del SVG, ya sin el prefijo de data URI ni el
`%23` escapado) y `uploadSvgEvidence` para subir las dos. El data URI no se usaba para nada más que subir.

Al escribir el test de `SignaturePad` apareció un defecto en el lienzo: `onPanResponderMove` copiaba
`currentPathRef` **dentro** del updater de `setPaths`, y si React corre ese updater después del release
(que vacía la ref), el último trazo queda vacío. Se toma la copia fuera del updater. Se incluye en esta
tarea porque cambia el contenido de la firma que se hashea y se sube.

## Archivos a tocar

### frontend/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/api/evidence.ts` | modificar | `SvgEvidence`, `prepareSvgEvidence`, `uploadSvgEvidence` |
| `src/components/SignaturePad.tsx` | modificar | Entregar el `SvgEvidence` del markup, sin data URI; copiar el trazo fuera del updater |
| `src/app/evidence/[visitId].tsx` | modificar | Foto de muestra y subida con las funciones nuevas |
| `src/api/__tests__/evidence.test.ts` | modificar | Criterios 1, 2 y 3 sobre `prepareSvgEvidence`/`uploadSvgEvidence` |
| `src/components/__tests__/signaturePad.test.tsx` | crear | La firma entrega un SVG cuyo hash es el de su contenido |

## Decisiones técnicas

- **Subir el markup del SVG y no el data URI** — Se descartó mantener el data URI y sólo hashearlo igual
  porque el archivo guardado seguiría sin ser una imagen, y el visor del backoffice no lo podría mostrar.
- **Hashear al capturar y no al subir** — Se descartó recalcular el hash justo antes de subir: el hash de
  captura es el que fija la evidencia en la cadena de custodia (y el que se muestra), y recalcularlo
  sobre lo que haya al momento de subir lo vaciaría de sentido. Lo que evita la divergencia es que la
  subida tome `content` del mismo objeto.
- **No usar `blob.arrayBuffer()`** (lo que propone el issue) — El `Blob` de React Native 0.86 no lo
  implementa, y tampoco permite construir un `Blob` desde bytes. Hashear el string con `TextEncoder`
  (UTF-8) coincide con cómo el `fetch` de Expo serializa un `Blob` creado desde ese string.
- **Nombre de archivo en la parte `file`** — Se pasa el nombre (`evidencia-pericial-N.svg`,
  `firma.svg`) para que el backend derive la extensión del nombre y el archivo guardado sea legible.

## Supuestos

- El `fetch` global de Expo 57 (`expo/fetch`) arma el multipart leyendo los bytes del `Blob` con
  `FileReader`, y un `Blob` de React Native creado desde un string guarda sus bytes en UTF-8. Se leyó en
  `node_modules/expo/src/winter/fetch/convertFormData.ts` y en `BlobManager`; no se pudo probar en un
  dispositivo desde este entorno.
- `FormData.append(name, blob, filename)` con tres argumentos está soportado por el `FormData` que
  instala Expo (`expo/src/winter/FormData.ts`).

## Cómo se prueba

- Tests unitarios: el hash declarado es el SHA-256 (calculado con `node:crypto`) de los bytes de la parte
  `file`, para foto y firma; el contenido empieza con `<svg`.
- Gates de `verificar.mjs` (lint, tipos y tests).
