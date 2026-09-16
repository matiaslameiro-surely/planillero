# PLAN-4 — Esqueleto inicial del backoffice (Angular)

## Contexto y problema

El repositorio `planillero-backoffice` está vacío: sólo tiene el README del commit inicial. Sin un
proyecto, ninguna tarea de backoffice puede empezar y los gates del harness no tienen nada que
verificar.

Es la tercera y última tarea de esqueleto. Cuando cierre, los tres repos quedan listos y se pueden
tomar tareas que crucen backend, móvil y web.

El backoffice **no parte de la plantilla `base-frontend`** del equipo, aunque replica su estructura de
carpetas. La plantilla trae autenticación contra el gateway corporativo, y este backoffice se
autentica contra el backend de Planillero; además nombra a la empresa en 23 lugares de `src/`, lo que
choca con la convención del proyecto. Se toma de ella lo que sirve —la organización de carpetas— y no
lo que ata a otro sistema.

Igual que en los otros dos esqueletos, tiene que demostrar que puede hablar con el backend: un
proyecto que compila pero nunca llamó a la API esconde los problemas que aparecen al integrar.

## Alcance

**Repos que toca:** `backoffice`

## Criterios de aceptación

1. `npm ci` desde un clon limpio instala las dependencias sin errores.
2. `npm run lint` existe y termina en verde; los warnings también fallan el gate.
3. `npm run build` compila la aplicación sin errores, con TypeScript en modo estricto.
4. `npm test` corre tests automatizados y termina en verde, sin necesidad de un navegador instalado.
5. La aplicación levanta con `npm start` y muestra una pantalla inicial de Planillero.
6. Esa pantalla consulta `GET /salud` del backend y muestra tres estados distinguibles: consultando,
   conectado y error de conexión. La URL base del backend sale de la configuración de entorno y no
   está escrita en el código.
7. Existe un test que verifica el servicio HTTP en sus dos caminos —respuesta correcta y fallo— sin
   depender de que el backend esté levantado.
8. `node .agents/scripts/verificar.mjs --tarea PLAN-4` detecta el proyecto y corre los tres gates en
   verde.
9. La estructura de carpetas replica la de `base-frontend`: `core/` (guards, interceptors, models,
   services), `shared/`, `pages/`, `environments/` y `styles/`.
10. El repo tiene `.gitignore` para artefactos de build y dependencias, y `.gitattributes` que
    normaliza los finales de línea.

## Fuera de alcance

- Autenticación y manejo de sesión: el backend todavía no la tiene, y es una tarea propia.
- Biblioteca de componentes (ng-zorro u otra) y sistema de diseño.
- Pantallas de negocio de planillas.
- Configuración de CI y despliegue.
- Tests de interfaz: el criterio 7 cubre el servicio HTTP, no el renderizado.

## Preguntas abiertas

Ninguna. Las decisiones técnicas abiertas (versión de Angular, runner de tests, cómo se configuran
los entornos) se resuelven en el plan y se aprueban en su checkpoint.
