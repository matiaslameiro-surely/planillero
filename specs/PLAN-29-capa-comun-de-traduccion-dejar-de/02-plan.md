# Plan técnico — PLAN-29

## Enfoque

La fuente única de etiquetas vive en `core/display/labels.ts`: mapas de código a texto en español y
una función `labelFor(kind, code)` que devuelve el código tal cual si no lo conoce. Tres pipes
standalone chicos la exponen a los templates: `label`, `shortId` y `appDate`. Cada pantalla reemplaza
su valor crudo por el pipe correspondiente.

No se agrega ninguna llamada nueva al backend, salvo una: el código de la visita en el visor de
evidencias se obtiene de `VisitsApiService.getVisitWithForm`, el mismo endpoint que ya usa el
Expediente.

## Archivos a tocar

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/core/display/labels.ts` | crear | Mapas de etiquetas y `labelFor()` (criterios 1 y 3) |
| `src/app/core/display/display.pipes.ts` | crear | Pipes `label`, `shortId` (abrevia UUID o hash) y `appDate` (`dd/MM/yyyy HH:mm`) |
| `src/app/core/display/display.spec.ts` | crear | Tests de etiquetas, fallback, abreviatura y formato de fecha |
| `src/app/core/models/planificacion.model.ts` | modificar | `VisitStatus` suma `IN_PROGRESS`, que el backend ya manda |
| `src/app/core/models/evidence.model.ts` | modificar | `verificationStatus` suma `PENDING` |
| `src/app/pages/planificacion/planificacion.html` | modificar | Urgencia y estado con `label` (líneas 97, 98 y 146) |
| `src/app/pages/planificacion/planificacion.ts` | modificar | Importar pipes; tooltip de sincronización con el formato común |
| `src/app/pages/expediente/expediente.component.ts` | modificar | Estado y urgencia con `label`, fechas con `appDate` |
| `src/app/pages/evidence-viewer/evidence-viewer.html` | modificar | Título con el código; estado y tipo con `label`; hashes con `shortId`; fechas con `appDate` |
| `src/app/pages/evidence-viewer/evidence-viewer.ts` | modificar | Cargar el código de la visita e importar los pipes |
| `src/app/pages/auditoria/auditoria.html` | modificar | Fecha con `appDate`, entidad traducida y abreviada, sin código crudo en la celda ni en el filtro |
| `src/app/pages/auditoria/auditoria.ts` | modificar | Importar pipes; el código del evento pasa al tooltip |
| `src/app/pages/auditoria/auditoria.spec.ts` | modificar | Cubrir la fecha formateada y la entidad traducida |
| `src/app/pages/supervision/supervision.html` | modificar | El `@switch` de estados pasa a `label` |
| `src/app/pages/supervision/supervision.ts` | modificar | Importar el pipe |

Total: 15 archivos (3 nuevos). Supera el límite de 12, así que el plan pasa por checkpoint.

## Decisiones técnicas

- **Pipes puros en lugar de métodos en cada componente.** Se descartaron funciones como
  `statusLabel()` en cada componente (como hoy `eventLabel()` en Auditoría) porque repiten la lógica
  en cada pantalla, que es justamente el problema. Además, un pipe puro sólo se vuelve a evaluar
  cuando cambia el valor.
- **Patrón de fecha explícito (`dd/MM/yyyy HH:mm`) en lugar de registrar `LOCALE_ID` es-AR.**
  Registrar el locale también cambia números y monedas en toda la app, y suma datos de locale al
  bundle. Con el patrón fijo, el resultado es igual en cualquier navegador.
- **Tooltip (`title`) para el valor completo de hashes y UUID.** Se descartaron un botón de copiar y
  un panel desplegable porque suman interacción nueva para un dato que el supervisor casi nunca
  necesita entero. La tabla de diagnóstico ya lo trunca así.
- **Si el código no se conoce, se muestra tal cual.** Si el backend manda un valor nuevo, aparece el
  código en vez de un texto vacío. Es el mismo criterio que ya usa Auditoría con los eventos
  desconocidos.

## Supuestos

- `GET /visitas/{id}/formulario` devuelve `code`. Verificado: lo usa el Expediente, y el endpoint
  admite SUPERVISOR y ADMINISTRATOR. Un OPERATOR que abra el visor no puede llamarlo; en ese caso el
  título usa el UUID abreviado.
- El PR de PLAN-23 (#12, Matías) toca otras líneas de `planificacion.html` (los encabezados de la
  tabla), así que Git puede combinar los dos cambios sin conflicto. Si ese PR se mergea antes, se
  rebasea.
- PLAN-30 (Fernando) puede tocar `supervision.html` y el visor de evidencias. Si se mergea antes,
  puede haber conflictos chicos en esos templates.

## Desvíos durante la implementación

Al recorrer los templates aparecieron más valores crudos que los que listaba el issue. Se sumaron a
la misma fuente, sin archivos nuevos:

- **Supervisión:** el tipo de excepción (`OUT_OF_SLA`, `LOW_BATTERY`) y el estado de red
  (`ONLINE`) se mostraban crudos.
- **Evidencias:** el resultado por evidencia de la verificación (`INTACT`, `MISSING_FILE`) y el texto
  «ALERTA DE MANIPULACIÓN (TAMPERED)», que ahora no incluye el código.
- **Planificación:** los filtros tenían su propia lista de etiquetas, y el de estado no incluía
  «En curso».
- **Fechas sin hora:** la fecha de la hoja de ruta y la fecha operativa salían en ISO
  (`2026-09-23`). Se sumó el pipe `appDay` (`dd/MM/yyyy`).

## Cómo se prueba

1. `display.spec.ts` cubre:
   - cada código conocido devuelve su etiqueta, y uno desconocido vuelve tal cual;
   - `shortId` abrevia los valores largos y deja igual los cortos;
   - `appDate` formatea `2026-11-10T15:00:00Z` con el patrón.
2. Los specs existentes de Auditoría, Planificación y Supervisión siguen en verde. El de Auditoría
   suma asserts para la fecha formateada y la entidad «Visita».
3. `node .agents/scripts/verificar.mjs --tarea PLAN-29` pasa: lint, build y tests.
4. Una búsqueda en los templates no encuentra ninguna interpolación directa de `status`, `urgency`,
   `evidenceType` o `verificationStatus` sin pipe.
