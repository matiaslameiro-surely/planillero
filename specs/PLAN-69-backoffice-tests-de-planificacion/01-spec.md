# PLAN-69 — Backoffice: tests de planificación fallan entre las 21:00 y la medianoche por zona horaria

## Contexto y problema

En el repositorio de `backoffice`, 5 tests de `src/app/pages/planificacion/planificacion.spec.ts` fallan cuando la fecha local del sistema difiere de la fecha UTC. En Argentina (UTC−3), esto ocurre diariamente entre las 21:00 y la medianoche hora local (cuando en UTC ya es el día siguiente).

La causa raíz es que el helper de tests calcula la fecha de «hoy» con `new Date().toISOString().slice(0, 10)`, lo cual devuelve la fecha UTC. En cambio, el componente de planificación trabaja con la fecha local (o la fecha del supervisor). Cuando se ejecutan los tests entre las 21:00 y las 23:59 UTC−3, la fecha de los mocks/datos generados en el helper apunta al día siguiente en UTC mientras que el componente espera o procesa la fecha local (o viceversa), produciendo inconsistencias en el filtrado y visualización de visitas de la hoja de ruta.

Con `TZ=UTC` todos los tests pasan porque ambas fechas coinciden. Es necesario que los tests calculen la fecha local de forma consistente con el componente y que los tests sean determinísticos y pasen a cualquier hora del día bajo cualquier zona horaria, incluyendo un test o validación que reproduzca y asegure este comportamiento.

## Alcance

**Repos que toca:** `backoffice`

## Criterios de aceptación

1. Los tests de `src/app/pages/planificacion/planificacion.spec.ts` calculan «hoy» utilizando la fecha local del sistema (formato `YYYY-MM-DD`), consistente con la lógica que utiliza el componente.
2. `npm test` en `backoffice` pasa en verde en cualquier horario, incluyendo la ventana entre las 21:00 y las 23:59:59 en zonas horarias con desfase negativo como Argentina (UTC−3).
3. Existe una prueba o verificación reproducible donde se simula/fija la hora del sistema (por ejemplo con `vi.setSystemTime`) en un horario donde la fecha local y la UTC difieren (e.g., 22:30 en UTC−3), demostrando que los tests afectados pasan correctamente.

## Fuera de alcance

- Modificaciones a la lógica de producción del componente `PlanificacionPage` a menos que sea estrictamente necesario para alinearlo con el contrato de fecha local.
- Cambios en otros módulos o páginas no relacionados con la planificación.

## Preguntas abiertas

Ninguna
