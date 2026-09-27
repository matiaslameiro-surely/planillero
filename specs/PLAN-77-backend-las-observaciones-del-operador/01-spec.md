# PLAN-77 — Backend: las observaciones del operador se ven con códigos HTML en Supervisión («tr&aacute;nsito»)

## Contexto y problema

Al registrar observaciones de operadores en el latido de supervisión (`POST /api/v1/supervision/heartbeat`), el servicio `SupervisionService` escapaba el texto como HTML con `HtmlUtils.htmlEscape(...)` en dos momentos: al persistir el turno del operador y al responder en el endpoint `GET /api/v1/supervision/operadores/estado`.

`HtmlUtils.htmlEscape` convierte caracteres acentuados, eñes y otros símbolos en entidades HTML (por ejemplo `á` en `&aacute;`). Debido al doble escape, una observación como «Demora por tránsito» terminaba almacenándose y respondiéndose como `Demora por tr&amp;aacute;nsito`, mostrándose ilegible en el cliente.

Al quitar el escape en el backend, el backend almacena y devuelve texto plano en UTF-8. Sin embargo, en el mapa de Supervisión del `backoffice` (`supervision-map.ts`), el popup de Leaflet se construye mediante interpolación directa de cadenas HTML (`${op.observations}`). Al recibir texto plano sin entidades escapadas, esto permitía la inyección de HTML arbitrario (como etiquetas `<b>`, `<a>` o links de phishing). Asimismo, el popup de `route-map.ts` interpola código, urgencia y dirección de visitas.

Por lo tanto, el alcance se amplía para asegurar que el `backoffice` escape adecuadamente los valores interpolados en los popups de Leaflet.

## Alcance

**Repos que toca:** `backend`, `backoffice`

## Criterios de aceptación

1. Una observación enviada con caracteres acentuados, eñes, comillas o símbolos (p. ej. `«Demora por tránsito en Ñuñoa, "calle cortada"»`) en `POST /api/v1/supervision/heartbeat` se almacena tal cual en la base de datos (con trim habitual si aplica) sin escape HTML ni conversión de entidades.
2. La consulta `GET /api/v1/supervision/operadores/estado` devuelve el texto de las observaciones exactamente como fue almacenado, sin escape HTML ni transformación.
3. Caracteres especiales y texto con formato de etiquetas (p. ej. `<script>alert(1)</script>`) viajan y se devuelven como texto plano literal sin alterar.
4. Pruebas de integración en el backend verifican el ciclo completo de envío y consulta de observaciones con acentos, caracteres especiales y delimitadores HTML.
5. En `backoffice`, el popup de Leaflet de `supervision-map.ts` escapa caracteres especiales HTML en `observations`, `username`, `activeVisitCode`, `networkStatus` y `status`, previniendo inyección de HTML.
6. En `backoffice`, el popup de Leaflet de `route-map.ts` escapa caracteres especiales HTML en `visit.code`, `visit.urgency` y `visit.address`.
7. Tests en `backoffice` validan que observaciones y atributos con contenido HTML se muestren como texto escapado y no como elementos HTML interpretados en los popups de Leaflet.

## Fuera de alcance

- Modificaciones en cliente móvil `frontend`, ya que React Native no renderiza HTML en `<Text>`.
- Migraciones de datos para desescapar registros históricos en bases de datos existentes, dado que las semillas de desarrollo (`V13__supervision_and_shifts.sql`) ya utilizan texto plano y no hay base productiva afectada.

## Preguntas abiertas

- [x] `NO-BLOQUEANTE` ¿Es necesario crear una migración Flyway para desescapar observaciones persistidas anteriormente? -> No, las semillas en `V13__supervision_and_shifts.sql` ya contienen texto plano y el ambiente local/desarrollo regenera las tablas de prueba.
