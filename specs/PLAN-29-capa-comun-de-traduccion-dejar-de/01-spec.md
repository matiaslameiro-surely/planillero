# PLAN-29 — Capa común de traducción: dejar de mostrar estados y códigos crudos del backend al supervisor

## Contexto y problema

La auditoría UX/UI de PLAN-18 (hallazgos H18 a H22) marcó «Reconocimiento antes que recuerdo» como no
cumplida. El backoffice muestra al supervisor identificadores de programación del backend, en inglés y
en mayúsculas (`IN_PROGRESS`, `HIGH`, `TAMPERED`, `PHOTO`), en una interfaz que por lo demás está en
español. Sólo Supervisión traduce sus estados, con un `@switch` propio. Planificación, Expediente,
Evidencias y Auditoría muestran el valor crudo.

Además:
- **H19:** Auditoría imprime `createdAt` sin formato. Expediente y Evidencias usan los formatos `short`
  y `medium` sin `LOCALE_ID`, que salen en formato de EE. UU. (`9/23/26, 9:21 AM`).
- **H20:** el visor de evidencias se titula con el UUID de la visita, y Auditoría muestra
  `entityType / entityId` crudos.
- **H21:** la galería de evidencias muestra hashes SHA-256 completos (64 caracteres), y el manifiesto
  muestra la firma HMAC entera.
- **H22:** en la bitácora, la etiqueta del evento convive con su código crudo, y el código se repite
  en cada opción del filtro.

Verificado en el código (23/09): el backend tiene valores que el modelo del backoffice no declara:
`VisitStatus.IN_PROGRESS` y `VerificationStatus.PENDING`. La traducción los tiene que cubrir.

## Alcance

**Repos que toca:** `backoffice`

## Criterios de aceptación

1. Existe **una sola fuente** de etiquetas en español para:
   - estado de visita: `PENDING`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`;
   - urgencia: `LOW`, `MEDIUM`, `HIGH`;
   - estado de turno: `EN_CAMPO`, `DEMORADO`, `OFFLINE`, `TURNO_COMPLETO`;
   - tipo de evidencia: `PHOTO`, `SIGNATURE`;
   - estado de verificación: `VERIFIED`, `TAMPERED`, `PENDING`;
   - tipo de entidad de auditoría: `VISIT`;
   - resultado por evidencia de la verificación: `INTACT`, `TAMPERED`, `MISSING_RECORD`, `MISSING_FILE`;
   - tipo de excepción de Supervisión: `OUT_OF_SLA`, `OFFLINE`, `LOW_BATTERY`;
   - estado de red del operador: `ONLINE`, `OFFLINE`, `UNKNOWN`.

   Los filtros de Planificación toman sus etiquetas de la misma fuente.

   Todas las pantallas la consumen, y Supervisión deja de tener su `@switch` propio.
2. Estas pantallas muestran la etiqueta en español, no el código:
   - Planificación: la grilla y la hoja de ruta.
   - Expediente: la cabecera y la ficha.
   - Evidencias: el estado del manifiesto y el tipo de cada tarjeta.
   - Auditoría: el tipo de entidad.
3. Un código que la fuente no conoce se muestra tal cual, en vez de desaparecer o romper la pantalla.
4. Todas las fechas con hora del backoffice usan el mismo formato, `dd/MM/yyyy HH:mm`. Incluye la
   columna de fecha de Auditoría (H19) y el tooltip de sincronización diferida de Planificación. Las
   fechas sin hora (fecha de la hoja de ruta y fecha operativa de Supervisión) usan `dd/MM/yyyy`.
5. El visor de evidencias se titula con el **código** de la visita, y si no se puede obtener, con el
   UUID abreviado. En Auditoría, el identificador de la entidad se muestra abreviado (8 caracteres),
   con el valor completo en el tooltip.
6. En la galería de evidencias y en la firma HMAC del manifiesto, los hashes se muestran abreviados,
   con el valor completo disponible en el tooltip.
7. En Auditoría, la celda del evento muestra sólo la etiqueta (el código queda en el tooltip), y las
   opciones del filtro ya no repiten el código.
8. Los gates del backoffice quedan en verde, con tests que cubren la fuente de etiquetas, el formato
   de fecha y la abreviatura de hashes.

## Fuera de alcance

- Mostrar el **código** de la visita en Auditoría: el backend sólo manda `entityId` (UUID), y
  resolverlo fila por fila sería una llamada por evento. Queda el UUID abreviado (criterio 5).
- La hora «Actualizado» de Supervisión (`lastUpdated`): es el hallazgo H1, que es parte de PLAN-30
  (Fernando).
- Cambios de estilos, colores o tipografía, que son de PLAN-23, PLAN-25 y PLAN-28.
- Internacionalización real (i18n de Angular con varios idiomas): la app es sólo en español.

## Preguntas abiertas

- [x] `NO-BLOQUEANTE` ¿Qué formato de fecha? Se usa `dd/MM/yyyy HH:mm`, el habitual en Argentina,
  con un patrón explícito que no depende del `LOCALE_ID`.
