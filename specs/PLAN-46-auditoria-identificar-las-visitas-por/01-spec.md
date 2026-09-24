# PLAN-46 — Auditoría: identificar las visitas por su código, validar el ID, mensajes en español y placeholder del filtro

## Contexto y problema

Detectado el 24/09 al recorrer la Auditoría como `admin.demo` en local.

1. **Verificar con un ID inválido** (por ejemplo `66`) muestra el mensaje técnico **«Invalid UUID
   string: 66»** y deja un `400` en la consola. El backoffice manda el valor tal cual, y el backend
   devuelve el mensaje de la excepción sin traducir.
2. **La tabla identifica la visita por su UUID abreviado** (`Visita / a0000001…`), y el completo sólo
   está en un tooltip que no se puede copiar. El supervisor conoce las visitas por su **código**
   (`V-1001`), que ve en todas las demás pantallas. Para verificar una visita hay que conseguir el
   UUID completo.
3. **El placeholder del filtro «Usuario» es `operador.demo`**, un usuario real, y parece un valor
   cargado.

Verificado en el código (24/09):
- `AuditLogDto` sólo trae `entityType` y `entityId`.
- `GET /audit/verify` recibe `visitId` como `UUID`.
- `visits.code` es `unique`, así que se puede resolver sin ambigüedad.
- PLAN-45 (Juan, backend #15) sólo toca `application.properties` y un test nuevo, así que no hay
  superposición.

## Alcance

**Repos que toca:** `backend`, `backoffice`

## Criterios de aceptación

1. `GET /api/v1/audit/logs` devuelve, en cada fila con `entityType = VISIT`, el campo `entityCode` con
   el código de la visita (o `null` si no se encuentra). Se resuelve con **una sola consulta por
   página**, no una por fila.
2. `GET /api/v1/audit/verify?visitId=` acepta **el UUID o el código** de la visita. Si no corresponde a
   ninguna visita, responde **404** con un mensaje en español. Vacío sigue verificando la cadena
   completa.
3. Un parámetro con formato inválido en cualquier endpoint (conversión de tipo) responde 400 con un
   mensaje en español, sin exponer el texto de la excepción.
4. La cadena de auditoría sigue verificando como íntegra: no se tocan las filas ni los hashes.
5. En el backoffice, la columna «Entidad» muestra `Visita V-1001`. El UUID completo va en el tooltip y
   se puede copiar con un botón. Si no llega el código, se muestra el UUID abreviado, como hoy.
6. En «Auditar Integridad de Visita», el campo acepta ID o código. Si el valor no tiene forma de
   ninguno de los dos, se muestra «Ingresá un ID o un código de visita válido» **sin llamar al
   backend** (no aparece el 400 en la consola). Si el backend responde 404, se muestra su mensaje.
7. El filtro «Usuario» usa un placeholder descriptivo («Filtrar por usuario»).
8. Tests en backend y backoffice que cubren 1 a 7, y gates en verde.

## Fuera de alcance

- Aplicar el filtro de usuario mientras se escribe (detalle menor del issue). Hoy se aplica al salir
  del campo o con Enter, y no fue la causa de la confusión, que era el placeholder.
- Guardar el código de la visita en `audit_logs`: la tabla es append-only y cambiar sus filas rompería
  la cadena.

## Preguntas abiertas

Ninguna.
