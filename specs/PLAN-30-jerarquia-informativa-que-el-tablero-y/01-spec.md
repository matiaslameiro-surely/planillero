# PLAN-30 — Jerarquía informativa: que el tablero y el visor muestren primero lo que exige acción

## Contexto y problema

A raíz de la auditoría UX/UI realizada en PLAN-18, se identificaron múltiples inconsistencias de jerarquía visual, frescura de datos, feedback de acciones y aprovechamiento del espacio en el backoffice (hallazgos H1 a H5, H23 a H26, H34 y H36).

El tablero central de supervisión y el visor de evidencias son herramientas de control crítico. Actualmente, el tablero no comunica cuánto hace que se refrescó ni marca los datos como obsoletos cuando una sincronización falla (mostrando métricas viejas junto a errores), y da el mismo peso visual a métricas de contexto que a excepciones urgentes que demandan acción (SLA / demorados). Además, las cabeceras ocupan demasiado espacio vertical obligando al mapa y lista de operadores a comenzar cerca de los 400 px en 1080p.
Por su parte, el visor de evidencias antepone hashes y firmas criptográficas antes de responder la pregunta esencial del perito («¿está intacta la evidencia?»), y mientras carga muestra «PENDIENTE DE SELLADO». En planificación el mensaje de éxito nunca expira, el home expone la URL técnica de la API a usuarios de negocio, y pantallas como el expediente se limitan a anchos estrechos con consultas responsive que sólo escalan hacia abajo, desaprovechando monitores de escritorio de 1080p o superiores.

Esta tarea implementa las correcciones necesarias para asegurar visibilidad del estado en tiempo real, foco inmediato en desvíos operativos y un diseño adaptado al entorno de escritorio.

## Alcance

**Repos que toca:** `backoffice`

## Criterios de aceptación

1. **Frescura y obsolescencia en supervisión (H1, H2)**:
   - El tablero muestra la antigüedad relativa del dato («hace X segundos») y/o cuenta regresiva para el próximo ciclo de refresco automático.
   - Cuando el refresco falla, los datos en pantalla se marcan de manera visible como desactualizados / obsoletos (`stale`) junto a la alerta correspondiente.

2. **Diferenciación de estados de carga vs datos (H4, H5)**:
   - En la cabecera de supervisión, la jurisdicción no muestra el texto «Cargando...» como si fuera un dato: el estado de carga es independiente, y si no hay jurisdicción se muestra un valor nulo descriptivo («—» o «Sin asignar»).
   - En el visor de evidencias, no se muestra «PENDIENTE DE SELLADO» mientras la información está cargando; se exhibe un estado neutro de carga hasta obtener la respuesta real.

3. **Jerarquía visual y foco en excepciones (H23, H26)**:
   - En el tablero de supervisión, los KPIs accionables («Fuera de SLA / Demorados», «Desconectados») tienen un tratamiento visual destacado y prioritario respecto a las métricas informativas de contexto («Operadores asignados», «Turnos completados»).
   - Se optimiza la densidad y altura vertical de los elementos superiores para que la lista operativa y el mapa comiencen significativamente antes de los 400 px en pantallas de 1080p.

4. **Veredicto pericial en visor de evidencias (H24)**:
   - El visor de evidencias presenta en primer lugar y de forma destacada el resultado del peritaje / integridad criptográfica («¿Está intacta la evidencia?») antes de los detalles técnicos secundarios (como la firma HMAC completa o identificadores brutos).

5. **Expiración de feedback de acciones (H3)**:
   - En planificación, el mensaje de confirmación de asignación exitosa de rutas/visitas expira automáticamente tras un intervalo razonable (ej. 5 segundos) o tras una nueva interacción.

6. **Reducción de ruido técnico en Home (H25)**:
   - Se elimina la exposición de la URL de la API del backend en la pantalla de inicio para usuarios de negocio, priorizando las tarjetas de navegación hacia las áreas operativas.

7. **Aprovechamiento de pantalla y responsive escritorio (H34, H36)**:
   - La pantalla de expediente y las vistas de backoffice optimizan la distribución en monitores amplios (usando `@media (min-width: ...)` o layouts en columnas elásticas) para evitar columnas estrechas innecesarias y scrolling evitable en monitores de 1920x1080 o superiores.

8. **Calidad y verificación**:
   - Todos los gates de calidad del backoffice (`npm run lint`, `npm run build`, `npm test`) finalizan con éxito sin regresiones.

## Fuera de alcance

- Modificaciones al backend (`planillero-backend`) o a la aplicación móvil (`planillero-frontend`).
- Rediseño de la lógica criptográfica de generación o verificación de firmas HMAC en backend.
- Cambios en el modelo de base de datos o endpoints REST.

## Preguntas abiertas

Ninguna.
