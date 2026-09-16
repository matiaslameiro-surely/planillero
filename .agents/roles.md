# Roles

El protocolo define **qué** hay que hacer en cada fase; este archivo define **quién** lo hace y, sobre
todo, **qué contexto debe y no debe tener**.

Son roles, no productos. Cada herramienta los implementa como pueda: subagentes con contexto propio,
sesiones separadas, o de forma secuencial en una sola conversación. Lo que no es negociable son los
requisitos de contexto de cada uno: son lo que hace que el resultado sirva.

---

## Analista

**Fase 1.** Convierte un issue de Jira en una especificación.

- **Entrada:** la clave del issue.
- **Salida:** `00-issue.json` (el issue crudo, como snapshot) y `01-spec.md`.
- **Necesita:** acceso de lectura a Jira (MCP de Atlassian) y lectura del código.
- **No necesita:** permiso de escritura sobre el código.

**Por qué conviene aislarlo:** los payloads de Jira son grandes y en su mayoría irrelevantes para el
resto del trabajo. Si entran al hilo principal, se arranca la tarea con miles de tokens de JSON que sólo
hacen ruido.

**Su responsabilidad más importante no es escribir la spec, es marcar lo que falta.** Un issue ambiguo
tiene que salir de esta fase con preguntas `BLOQUEANTE`, no con supuestos disfrazados de requisitos.

---

## Implementador backend

**Fase 3.** Implementa la parte de `backend/`, el repo que **produce** el contrato de API.

- **Entrada:** `01-spec.md`, `02-plan.md`, su parte de `04-tareas.md`.
- **Salida:** código, commits y —si el alcance incluye algún cliente— **`03-contrato-api.md`**.
- **Necesita:** lectura y escritura sobre `backend/`, y poder correr los gates.

**Corre siempre antes que los clientes.** El contrato de API que emite es lo que les permite
implementarse sin tener el backend levantado.

**Por qué conviene aislarlo:** un build o un test fallido de Java vuelca cientos de líneas de stack trace
que no le sirven a nadie más.

---

## Implementador de un cliente

**Fase 3.** Implementa la parte de un repo que **consume** la API: `frontend/` (móvil) o
`backoffice/` (web). Es el mismo rol en los dos casos; lo que cambia es el stack.

- **Entrada:** `01-spec.md`, `02-plan.md`, su parte de `04-tareas.md` y **`03-contrato-api.md`**.
- **Salida:** código y commits.
- **Necesita:** lectura y escritura sobre su repo, y poder correr los gates.

**Corre siempre después del backend**, y **es independiente de los otros clientes**: no espera a que
el móvil o el backoffice terminen, ni asume nada sobre lo que hicieron.

**No inventa endpoints.** Si necesita algo que el contrato no cubre, eso es un hallazgo: se vuelve al
backend y se actualiza el contrato **para todos los clientes**, no se improvisa un endpoint que no
existe ni se parchea sólo de un lado.

---

## Revisor

**Fase 4.** Revisa el diff contra la especificación.

- **Entrada:** el diff de la rama (`git diff <ramaBase>...HEAD`) y `01-spec.md`. **Nada más.**
- **Salida:** un JSON que cumple `.agents/schemas/revision.schema.json`, guardado en
  `specs/<tarea>/05-revision-<repo>-<n>.json`. Se revisa **un repo por vez**: el diff de cada uno se
  evalúa por separado.
- **Necesita:** lectura del código y de git.
- **No debe tener:** permiso de escritura, ni el razonamiento de quien implementó.

Dos restricciones que son el rol entero:

1. **Contexto limpio.** Si el revisor ve por qué el implementador hizo lo que hizo, deja de evaluar el
   código y pasa a evaluar el argumento. Su valor está en mirar el resultado sin la historia.
2. **Sin permiso de escritura.** Un revisor que puede arreglar lo que encuentra arregla en vez de
   reportar, y los hallazgos desaparecen del registro. Reportar y corregir son dos pasos, y el segundo
   es de la fase 3.

El motor que lo ejecuta lo elige cada desarrollador en su `workspace.local.json`. El motor `anfitriona`
significa que lo hace la IA que ya está corriendo — respetando igual las dos restricciones de arriba.

---

## Qué **no** es un rol

Vale la pena dejarlo escrito para que nadie agregue maquinaria que no hace falta:

- **Planificador.** La fase 2 se queda en el hilo principal: es quien tiene que razonar sobre el plan y
  presentárselo al usuario en el checkpoint. Delegarla agrega una vuelta más y pierde detalle.
- **Verificador.** Verificar es determinístico —correr comandos y leer códigos de salida—. Lo hace
  `verificar.mjs`: más barato, más rápido y reproducible.
- **Creador de PRs / actualizador de Jira.** Son llamadas a herramientas sin criterio. Scripts.
