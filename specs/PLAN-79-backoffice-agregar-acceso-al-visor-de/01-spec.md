# PLAN-79 — Backoffice: agregar acceso al visor de evidencias desde el expediente

## Contexto y problema

El visor de evidencias (`/evidence/:visitId`: fotos, firma, manifiesto sellado y «Verificar
integridad») no es alcanzable desde ninguna pantalla: sólo se llega escribiendo la URL. Detectado el
27/09 en la prueba local. PLAN-80 (mergeada el 27/09) hizo que las fotos se vean; ahora falta llegar.

Verificado en el código: el expediente (`/expediente/:visitId`, sólo supervisores) no tiene link al
visor, y el visor (`/evidence/:visitId`, los tres roles) sólo ofrece «← Volver al Panel» (`/`).

## Alcance

**Repos que toca:** `backoffice`

## Criterios de aceptación

1. El expediente de una visita accesible muestra un link «Ver evidencias» que lleva a
   `/evidence/<id de la visita>`.
2. En el visor, un **supervisor** ve «← Volver al expediente», que lleva a `/expediente/<id>`.
3. En el visor, un **administrador u operador** (que no pueden abrir el expediente) sigue viendo
   «← Volver al Panel» (`/`), como hoy.
4. Funciona con V-1001 (manifiesto sellado), V-1002 (evidencias sin sellar) y una visita sin
   evidencias: el visor ya muestra esos estados.
5. Si el expediente muestra el aviso de sin acceso o inexistente (PLAN-63), **no** aparece
   «Ver evidencias».
6. Tests de componente para la presencia y el destino de los links en las dos pantallas.
7. Gates del backoffice en verde.

## Fuera de alcance

- Links al visor desde Planificación o Supervisión.
- Las observaciones menores de la revisión de PLAN-80 (descargas en vuelo, carga ansiosa).

## Preguntas abiertas

- [x] `NO-BLOQUEANTE` — **¿Adónde vuelve el visor para quien no es supervisor?** Al Panel, como hoy:
  el expediente tiene `supervisorGuard` y le mostraría «Acceso denegado».
