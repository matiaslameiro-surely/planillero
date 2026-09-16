# PLAN-3 — Esqueleto inicial del frontend (React Native + Expo)

## Contexto y problema

El repositorio `planillero-frontend` está vacío: sólo tiene el README del commit inicial. Sin un
proyecto, ninguna tarea de frontend puede empezar y los gates del harness (`lint`, `tipos`, `tests`)
no tienen nada que verificar — hoy se saltean por falta de `package.json`.

Es la contraparte de PLAN-2. Cuando esta tarea cierre, los dos repos quedan listos y recién ahí se
pueden tomar tareas full-stack, que son la mayoría del backlog.

Además de la estructura, el esqueleto tiene que demostrar que el circuito completo funciona: que la
app móvil puede hablar con el backend. Un esqueleto que compila pero nunca llamó a una API esconde
justamente los problemas que aparecen al integrar (URL base, CORS, formato de respuesta, manejo de
error de red).

## Alcance

**Repos que toca:** `frontend`

## Criterios de aceptación

1. `npm ci` desde un clon limpio instala las dependencias sin errores.
2. `npm run lint` termina en verde.
3. `npx tsc --noEmit` termina en verde, con TypeScript en modo estricto.
4. `npm test` corre tests automatizados y termina en verde; el script existe y no se saltea.
5. La aplicación arranca con Expo y muestra una pantalla inicial de Planillero.
6. Esa pantalla consulta `GET /salud` del backend y muestra tres estados distinguibles: consultando,
   conectado, y error de conexión. La URL base del backend se configura por variable de entorno y no
   está escrita en el código.
7. Existe un test que verifica el cliente HTTP en los dos caminos —respuesta correcta y fallo de
   red— sin depender de que el backend esté levantado.
8. `node .agents/scripts/verificar.mjs --tarea PLAN-3` detecta el proyecto y corre los tres gates en
   verde.
9. El repo tiene `.gitignore` para artefactos de build y dependencias, y un `.env.example` que
   documenta las variables necesarias sin incluir valores reales.

## Fuera de alcance

- Autenticación y manejo de sesión.
- Manejo de estado global (Redux u otro): todavía no hay estado que compartir.
- Sistema de diseño y tematización.
- Pantallas de negocio de planillas.
- Builds nativos, configuración de EAS y publicación en tiendas.
- Tests de interfaz de usuario: el criterio 7 cubre el cliente HTTP, no el renderizado.

## Preguntas abiertas

Ninguna. Las decisiones técnicas abiertas (versión de Expo, sistema de navegación, cliente HTTP,
framework de tests) se resuelven en el plan y se aprueban en su checkpoint.
