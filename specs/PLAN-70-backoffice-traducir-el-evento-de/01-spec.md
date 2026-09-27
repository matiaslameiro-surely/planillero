# PLAN-70 — Backoffice: traducir el evento de auditoría VISIT_COMPLETED («Visita finalizada»)

## Contexto y problema

PLAN-58 agregó en el backend el evento de auditoría `VISIT_COMPLETED`
(`VisitCompleteService`, `@AuditLog(eventType = "VISIT_COMPLETED")`), pero el catálogo del
backoffice (`src/app/core/models/audit-event-types.ts`) no lo tiene. En Auditoría el badge muestra el
código crudo en gris, el tooltip dice «Tipo de evento sin descripción registrada» y el evento no
aparece en el filtro «Tipo de evento».

Verificado el 27/09: de los eventos que emite el backend (`VISIT_ASSIGNED`, `VISIT_STARTED`,
`FORM_SUBMITTED`, `EVIDENCE_SAVED`, `VISIT_COMPLETED`, `MANIFEST_SIGNED`), `VISIT_COMPLETED` es el
único que falta.

## Alcance

**Repos que toca:** `backoffice`

## Criterios de aceptación

1. En la grilla de Auditoría, un evento `VISIT_COMPLETED` se muestra con el badge «Visita completada» (la misma palabra que el estado «Completada»; el issue decía «Visita finalizada», se cambió con el usuario el 27/09),
   con tono de color propio (no el gris de «desconocido») y una descripción en el tooltip.
2. «Visita completada» aparece en el filtro «Tipo de evento», en el orden del ciclo de la visita, y al
   elegirlo se consulta el backend con `eventType=VISIT_COMPLETED`.
3. Test que falla si el catálogo no incluye el evento: badge, tooltip y opción del filtro.
4. Gates del backoffice en verde.

## Fuera de alcance

- Cambios en el backend.
- Otros textos de Auditoría (Enter en la verificación: PLAN-73).

## Preguntas abiertas

Ninguna.
