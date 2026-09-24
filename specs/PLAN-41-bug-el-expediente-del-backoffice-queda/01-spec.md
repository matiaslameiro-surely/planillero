# PLAN-41 — Bug: el expediente del backoffice queda para siempre en «Cargando expediente...»

## Contexto y problema

Detectado el 24/09 al recorrer el backoffice con el entorno local. Al abrir el expediente de una
visita (`/expediente/<id>`), la pantalla queda en «Cargando expediente...» y nunca muestra ni la
visita ni un error.

- El backend responde bien: `GET /api/v1/visitas/{id}/formulario` devuelve 200 con la visita.
- El backoffice usa Angular 22 **sin `zone.js`**: la vista sólo se vuelve a dibujar cuando cambia un
  signal o hay un evento del template.
- `ExpedienteComponent` guarda su estado en propiedades comunes (`loading`, `visit`, `formSchema`,
  `error`) y las cambia después de un `await`. Los datos llegan, pero nada avisa a Angular.

Verificado en el código (24/09): es el único componente con este patrón. Los demás usan signals, o
asignan propiedades comunes que no se muestran en pantalla (el `challengeId` del login, los timers de
Planificación y Supervisión). `DynamicFormComponent` ya usa signals e `input()`.

## Alcance

**Repos que toca:** `backoffice`

## Criterios de aceptación

1. Al abrir el expediente de una visita existente, la pantalla sale de «Cargando expediente...» y
   muestra el código de la visita en el título.
2. Si la API falla, la pantalla muestra «No se pudo cargar el expediente» y no queda cargando.
3. Si la visita tiene formulario con respuestas, se muestra el formulario en modo solo lectura.
4. Sin `visitId` en la ruta, se muestra «ID de visita no proporcionado».
5. Hay un spec del expediente que cubre los casos 1 a 4. Los casos 1 y 2 fallan con el código actual
   y pasan con el arreglo.
6. Los gates del backoffice quedan en verde, incluida la guardia de PLAN-40.

## Fuera de alcance

- Cambios visuales o de contenido del expediente.
- Otros componentes: la revisión no encontró otro con el mismo problema.

## Preguntas abiertas

Ninguna.
