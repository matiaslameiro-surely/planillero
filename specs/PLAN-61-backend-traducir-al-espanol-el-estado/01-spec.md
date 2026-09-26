# PLAN-61 — Backend: traducir al español el estado de la visita en los mensajes de error

## Contexto y problema

Cuando una visita no se puede asignar porque está `IN_PROGRESS`, `COMPLETED` o `CANCELLED`,
`PlanningService` arma el mensaje de error con el nombre del enum en minúsculas:

```
La visita V-1001 no se puede asignar (estado in_progress).
```

Ese mensaje lo lee el supervisor en el backoffice, así que el estado le llega en inglés y con guion bajo.

El issue nombra sólo la asignación, pero el mismo patrón (`getStatus().name().toLowerCase()`) está en
otros dos mensajes de error de visitas:

- `VisitStartService` — `visit_not_startable`: «La visita V-1001 no se puede iniciar (estado …).»
- `VisitCompleteService` — `visit_not_in_progress`: «Sólo se puede completar una visita en curso
  (estado …).»

Estos dos los lee el operador en la app. Además pueden mostrar `pending` y `assigned`, que en la
asignación no aparecen.

Los clientes no interpretan el texto: deciden por el código `error`. El backoffice
(`core/display/labels.ts`) y la app (`VisitCard.tsx`) ya muestran los estados como «Pendiente»,
«Asignada», «En curso», «Completada» y «Cancelada».

## Alcance

**Repos que toca:** `backend`

## Criterios de aceptación

1. El mensaje de `visit_not_assignable` nombra el estado en español: «en curso», «completada» o
   «cancelada». Por ejemplo: «La visita V-1001 no se puede asignar (estado en curso).»
2. Los mensajes de `visit_not_startable` y `visit_not_in_progress` también nombran el estado en
   español, con las mismas palabras. Se suman «pendiente» y «asignada».
3. Las palabras son las que ya usan los clientes, en minúscula porque van en medio de una oración.
4. Los códigos de error (`visit_not_assignable`, `visit_not_startable`, `visit_not_in_progress`) y
   los status HTTP no cambian.
5. Cada estado del enum tiene su nombre en español, y hay un test que falla si se agrega un estado
   sin nombre.
6. Hay tests de integración que verifican el texto de `message` en español en los tres casos, además
   del código de error.
7. Los gates del backend (compilar, tests) pasan en verde.

## Fuera de alcance

- Cambiar cómo se serializa el estado en la API: el JSON sigue devolviendo `IN_PROGRESS`, etc.
- Tocar los clientes: ya muestran sus propias etiquetas.
- Otros mensajes de error del backend que no incluyen el estado de la visita.

## Preguntas abiertas

- [x] `NO-BLOQUEANTE` El issue nombra sólo el mensaje de asignación. Los de iniciar y completar tienen
  el mismo problema y se resuelven con el mismo cambio, así que la spec los incluye (criterio 2). Si
  se prefiere limitarlo a la asignación, se sacan el criterio 2 y sus tests. **Resuelta:** el usuario
  aprobó incluirlos en el checkpoint del plan.
