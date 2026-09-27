# Plan técnico — PLAN-69

## Enfoque

En `backoffice/src/app/pages/planificacion/planificacion.spec.ts`, el objeto fixture `hoja` define `date: new Date().toISOString().slice(0, 10)`, lo cual evalúa la fecha en UTC en lugar de la fecha local. Como el componente `Planificacion` inicializa su fecha con la fecha local del supervisor (`todayIso()`), entre las 21:00 y la medianoche en zonas horarias negativas (como Argentina, UTC−3) `hoja.date` y la fecha activa del componente no coinciden, ocasionando que `currentSheetIds` quede vacío y fallen los tests que verifican visitas que ya están en la hoja.

Para solucionarlo:
1. Se define una función helper `todayIso(): string` en `planificacion.spec.ts` que obtiene la fecha local en formato `YYYY-MM-DD` (`now.getFullYear()`, `now.getMonth() + 1`, `now.getDate()`), consistente con la lógica de `planificacion.ts` y el test de `min` date en la línea 321.
2. `hoja` y `hojaVacia` se inicializan dinámicamente en el `beforeEach` utilizando `todayIso()`, asegurando que cualquier manipulación del reloj del sistema afecte de inmediato tanto a los stubs como al componente.
3. Se agrega un bloque de prueba reproducible con `vi.useFakeTimers()` y `vi.setSystemTime(...)` fijando una hora nocturna (ej. `2026-09-25T23:30:00-03:00`, correspondiente a `2026-09-26T02:30:00Z`), donde la fecha local (25) y la UTC (26) difieren, verificando que los tests de hojas de ruta pasen exitosamente.

## Archivos a tocar

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/pages/planificacion/planificacion.spec.ts` | modificar | Usar fecha local en `hoja`/`hojaVacia`, instanciarlas en `beforeEach`, y añadir prueba con reloj fijado en horario nocturno con desfase UTC |

## Decisiones técnicas

- **Definir helper local `todayIso()` en el archivo de especificación** — Se descartó exportar la función interna de `planificacion.ts` porque es un detalle de implementación privado; duplicar la función pura de 5 líneas mantiene el desacoplamiento de las pruebas de caja negra.
- **Asignar `hoja` y `hojaVacia` en `beforeEach`** — Se descartó mantener constantes evaluadas al cargar el módulo porque ante manipulaciones del reloj con `vi.setSystemTime` en tests específicos, las constantes estáticas retendrían la fecha de inicio del proceso de pruebas.

## Supuestos

Ninguno.

## Cómo se prueba

1. Ejecución focalizada de tests: `npm test -- --include=src/app/pages/planificacion/planificacion.spec.ts` dentro de `backoffice/`.
2. Ejecución de todos los tests de backoffice: `npm test` en `backoffice/`.
3. Verificación de gates completos mediante `node .agents/scripts/verificar.mjs --tarea PLAN-69`.
