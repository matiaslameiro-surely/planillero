# Plan técnico — PLAN-30

## Enfoque

Resolver los 10 hallazgos de jerarquía visual y visibilidad del estado detectados en la auditoría UX/UI (H1 a H5, H23 a H26, H34, H36) en el repo `backoffice`.

El enfoque se divide en cuatro ejes:
1. **Frescura y resiliencia en supervisión (H1, H2, H5, H23, H26)**:
   - Añadir temporizador de frescura relativa («actualizado hace X s» y «próximo refresco en Y s»).
   - Flag de estado obsoleto (`isStale`) cuando falla el refresco en segundo plano, indicando al usuario que los datos visualizados no están vigentes en vez de mantener un tablero que parece actual.
   - Separar el estado de carga (`loading()`) del dato de la jurisdicción para evitar que valores nulos muestren «Cargando...» indefinidamente.
   - Reestructurar los KPIs y cabecera: destacar visualmente las excepciones accionables (fuera de SLA, desconectados) y compactar la altura para que el mapa y lista comiencen significativamente antes de los 400 px.
2. **Priorización pericial en evidencias (H4, H24)**:
   - Evitar mostrar «PENDIENTE DE SELLADO» mientras la petición está en vuelo; mostrar indicador de carga pericial neutro.
   - Reubicar el veredicto de integridad criptográfica al inicio de la pantalla con jerarquía prominente, desplazando la firma HMAC completa y metadata técnica a una sección secundaria.
3. **Claridad en feedback y eliminación de ruido técnico (H3, H25)**:
   - En planificación, incorporar autodestrucción/expiración automática del aviso de asignación exitosa tras 6 segundos.
   - En Home, eliminar la exposición de la URL de la API del backend, manteniendo el indicador de estado de conexión simple para el usuario de negocio.
4. **Elasticidad y aprovechamiento de pantalla en escritorio (H34, H36)**:
   - En expediente, implementar layout elástico de 2 columnas en pantallas de escritorio (`@media (min-width: 1024px)`) para evitar el apilamiento vertical y los espacios vacíos laterales de más de 1000 px.
   - Añadir media queries `min-width` en supervisión y expediente para pantallas amplias (>= 1400px / 1600px).

## Archivos a tocar

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/pages/supervision/supervision.ts` | modificar | Cálculo de frescura relativa, cuenta regresiva de polling, estado de datos obsoletos (`isStale`). |
| `src/app/pages/supervision/supervision.html` | modificar | Mostrar frescura, alerta de datos obsoletos, separar carga de jurisdicción, jerarquizar KPIs de excepción. |
| `src/app/pages/supervision/supervision.scss` | modificar | Estilos para KPIs prioritarios, reducción de altura de cabecera y soporte para monitores anchos (`min-width`). |
| `src/app/pages/supervision/supervision.spec.ts` | modificar | Pruebas unitarias para frescura relativa, estado stale ante fallos y carga de jurisdicción. |
| `src/app/pages/evidence-viewer/evidence-viewer.html` | modificar | Jerarquía pericial en primer plano y estado de carga neutro previo al sellado. |
| `src/app/pages/evidence-viewer/evidence-viewer.scss` | modificar | Estilos para el banner pericial prioritario y metadatos secundarios. |
| `src/app/pages/planificacion/planificacion.ts` | modificar | Expiración automática del mensaje de éxito tras asignación de rutas (6 segundos). |
| `src/app/pages/planificacion/planificacion.spec.ts` | modificar | Pruebas de expiración del aviso de asignación. |
| `src/app/pages/home/home.html` | modificar | Remover exposición de la URL de la API técnica. |
| `src/app/pages/expediente/expediente.component.ts` | modificar | Layout elástico de 2 columnas en pantallas de escritorio (`@media (min-width: 1024px)`). |

## Decisiones técnicas

- **Manejo de frescura con señal periódica local en Supervisión** — Se descartó depender de pipes de fechas asincrónicos externos porque un `signal` reactivo (`relativeTime` / `secondsUntilNextRefresh`) desacoplado permite formatear «Actualizado hace X s» y «Próximo en Y s» sin dependencias pesadas.
- **Diferenciación de error vs obsolescencia en Supervisión** — Se descartó borrar los datos ante un fallo de red porque el usuario perdería el contexto previo; en su lugar, se conservan los datos pero marcados visiblemente con badge y clase de alerta de obsolescencia (`supervision-container--stale`).
- **Layout de 2 columnas en Expediente con CSS Grid** — Se descartó forzar anchos fijos mayores a 900 px en una sola columna porque la lectura de formularios se vuelve incómoda. Un grid con panel de datos de visita a la izquierda y formulario a la derecha en pantallas grandes aprovecha el ancho manteniendo la legibilidad.
- **Temporizador de descarte en Planificación** — Se descartó requerir que el usuario cierre manualmente la notificación con una cruz («X») porque agrega fricción operativa innecesaria; un timeout automático de 6 s limpia el feedback oportunamente.

## Supuestos

Ninguno.

## Cómo se prueba

1. **Supervisión**:
   - Verificar que al inicializar la pantalla se muestre la antigüedad relativa («Actualizado hace ...») y el contador al próximo refresco.
   - Simular error en `supervisionService.getTableroResumen()` o `getOperadoresEstado()` y comprobar que `isStale` se active y muestre el aviso de datos obsoletos.
   - Comprobar que si la jurisdicción es `null`, no se muestre «Cargando...» una vez cargado el resumen.
   - Verificar que los KPIs de excepción («Fuera de SLA / Demorados») tengan mayor destaque visual.
2. **Visor de evidencias**:
   - Verificar que mientras `loading()` sea true, no se renderice «PENDIENTE DE SELLADO».
   - Verificar que el veredicto de integridad criptográfica encabece la sección antes de la firma HMAC.
3. **Planificación**:
   - Asignar una visita y verificar que el aviso de éxito aparezca y desaparezca luego del intervalo programado.
4. **Home**:
   - Confirmar que la URL de la API ya no se muestra en el panel de conexión.
5. **Expediente**:
   - Probar en viewport de escritorio (>= 1024px) que los datos de la visita y el formulario se organicen en dos columnas sin espacio vacío excesivo.
6. **Gates automáticos**:
   - Ejecutar `npm run lint`, `npm run build` y `npm test` en `backoffice` y verificar que todos pasen sin errores.
