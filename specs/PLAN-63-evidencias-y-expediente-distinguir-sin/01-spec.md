# PLAN-63 — Evidencias y expediente: distinguir «sin acceso» y «no existe»

## Contexto y problema

Detectado el 25/09 en la prueba E2E del backoffice sobre `main` y reproducido a mano por Federico.
Aparece desde que el backend responde `403` por jurisdicción o asignación (PLAN-49) y `404` por
visita inexistente (PLAN-51).

- **Visor de evidencias** (`/evidence/:visitId`), con una visita de otra zona: el backend responde
  `403` a `/evidences`, `/manifest` y `/formulario`, pero la pantalla muestra «Pendiente de sellado» y
  «Evidencias custodiadas (0)», como si la visita existiera y estuviera vacía. El supervisor recibe
  información falsa. El visor ignora hoy cualquier error de `/evidences`, y a cualquier error de
  `/manifest` lo trata como «sin manifiesto».
- **Expediente** (`/expediente/:visitId`): el mismo «No se pudo cargar el expediente» para `403` y
  para `404`, sin link para volver (el link sólo aparece cuando carga), y un `console.error` con el
  error crudo.

Verificado en el código (25/09): `evidence-viewer.ts` (`loadData`) y `expediente.component.ts`
(`loadExpediente`).

## Alcance

**Repos que toca:** `backoffice`

## Criterios de aceptación

1. **Expediente:** ante un `403`, muestra «No tenés acceso a esta visita.». Ante un `404`, muestra
   «La visita no existe.». Ante otro error, sigue diciendo «No se pudo cargar el expediente.».
2. **Expediente:** en el estado de error se ofrece «← Volver a planificación».
3. **Expediente:** no hay `console.error` propio de la app.
4. **Visor de evidencias:** si `/evidences` responde `403`, la pantalla muestra «No tenés acceso a
   esta visita.»; si responde `404`, «La visita no existe.». En esos casos **no** muestra el estado de
   sellado, el veredicto, el botón de verificar ni la lista de evidencias.
5. **Visor de evidencias:** el link «← Volver al Panel» sigue visible también en el error.
6. **Visor de evidencias:** el estado «Pendiente de sellado» queda sólo para cuando la visita es
   accesible y no tiene manifiesto (`404 manifest_not_found`), no para cualquier error.
7. **Visor de evidencias, operador:** el 403 del pedido del título (`/formulario`, que el operador no
   puede leer por su rol) **no** cuenta como «sin acceso». Un operador con la visita asignada sigue
   viendo sus evidencias como hoy.
8. Tests de `403` y `404` en las dos pantallas, y gates en verde.

## Fuera de alcance

- La tipografía de estas pantallas y la jurisdicción cruda del expediente: son de PLAN-64.
- Mostrar el código de la visita en el visor cuando el usuario no tiene acceso (se ve el UUID, como
  hoy).
- Los errores del botón «Verificar integridad» (hoy se ignoran). Si hace falta, otra tarea.

## Preguntas abiertas

- [x] `NO-BLOQUEANTE` — **¿Qué pedido decide «sin acceso» en el visor?** `/evidences`, porque lo
  pueden pedir los tres roles y responde `403` sólo por jurisdicción o asignación. `/formulario`
  también devuelve `403` al operador por su rol.
