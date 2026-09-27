# Plan técnico — PLAN-70

## Enfoque

Sumar `VISIT_COMPLETED` al catálogo `AUDIT_EVENT_TYPES`, entre `EVIDENCE_SAVED` y `MANIFEST_SIGNED`
(orden del ciclo: la visita se finaliza y después se sella el manifiesto). La grilla y el filtro ya
leen de ese catálogo, así que no hace falta tocar la pantalla.

## Archivos a tocar

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/core/models/audit-event-types.ts` | modificar | Entrada `VISIT_COMPLETED` → «Visita completada», tono `success` |
| `src/app/pages/auditoria/auditoria.spec.ts` | modificar | Opción nueva en el filtro y badge/tooltip del evento |

## Decisiones técnicas

- **Tono `success`**, igual que «Visita iniciada» y «Manifiesto firmado»: es un hito positivo del
  ciclo. Se descartó sumar un tono nuevo porque obligaría a definir otro color en `auditoria.scss`
  sin necesidad.
- **Texto «Visita completada»** (decidido por el usuario el 27/09): el estado `COMPLETED` de la visita
  se muestra como «Completada» en el resto del backoffice (`core/display/labels.ts`), así que el evento
  usa la misma palabra. Se descartó «Visita finalizada», el texto del issue, para no nombrar lo mismo
  de dos maneras.

## Supuestos

- La descripción del evento: «El operador finalizó la visita en campo.». Sale de `VisitCompleteService`
  (lo invoca el operador desde el móvil).
- No hay supuestos `RIESGO`.
