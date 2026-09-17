# AGENTS.md

Instrucciones para cualquier asistente de IA que trabaje en este repositorio.
Este archivo es la **fuente de verdad**. Si tu herramienta usa otro archivo (`CLAUDE.md`, `GEMINI.md`,
`.github/copilot-instructions.md`), ese archivo debe limitarse a importar o apuntar a este.

Specs, planes, comentarios de código (donde amerite), mensajes de commit y descripciones de PR se
escriben en **español**. El **código** (clases, métodos, variables, tablas, etc.) se escribe en **inglés**,
siguiendo las convenciones de estilo estándar de cada lenguaje y contexto (ver Convenciones).

## Qué es este repo

El **harness** de Planillero: el andamiaje que toma tareas del Jira del proyecto, las lleva por un ciclo
de **desarrollo guiado por especificación (SDD)** y las cierra con un PR verificado.

Acá **no vive código de producto**. Viven el protocolo, los scripts y las especificaciones. El código
está en tres repos separados que se clonan adentro de esta carpeta:

| Carpeta | Repo | Stack | Qué es |
|---|---|---|---|
| `backend/` | `…/planillero-backend` | Java + Spring Boot | La API. **Define el contrato** que consumen los otros dos |
| `frontend/` | `…/planillero-frontend` | React Native + Expo | La aplicación móvil |
| `backoffice/` | `…/planillero-backoffice` | Angular | El backoffice web |

Las tres están en `.gitignore`: son repos independientes con su propio historial.

El alcance de una tarea puede ser cualquier combinación de los tres. Los repos y su orden salen de
`workspace.json`, así que sumar uno nuevo no requiere tocar ningún script.

## Regla de oro: agnóstico de herramienta

Lo van a usar varios desarrolladores, **cada uno con la IA que prefiera**. Por eso:

> Se versiona **qué** hay que hacer. **Con qué IA** lo hace cada uno es configuración local.

| Se versiona | Nunca se versiona |
|---|---|
| `AGENTS.md`, `.agents/`, `workspace.json`, `specs/` | `workspace.local.json` — tu `JAVA_HOME`, tu motor de revisión |
| | `.claude/`, `.codex/`, `.cursor/`, `.gemini/`… — la capa de **cualquier** herramienta |
| | `backend/`, `frontend/`, `backoffice/` — clones de los repos de producto |

**Antes de agregar algo a `workspace.json`, preguntate si vale para todo el equipo.** Si es una ruta de
tu máquina, una preferencia tuya o el nombre de un producto que usás vos, va en `workspace.local.json`.

No crees en este repo archivos ni carpetas atados a una herramienta puntual. Si tu herramienta soporta
comandos propios, generalos con `node .agents/scripts/init.mjs`: quedan en tu carpeta local, ya ignorada.

## Cómo se dispara el trabajo

**Cuando el usuario pida cualquiera de estas tres cosas, seguí `.agents/protocolo.md` de principio a fin,
sin saltear fases:**

| El usuario dice | Qué hacés |
|---|---|
| «agarrá la próxima tarea (y hacela)» | Corré `node .agents/scripts/cola.mjs`. Decile **qué tarea eligió y por qué** antes de arrancar |
| «hacé PLAN-12» | Esa tarea puntual |
| «hacé esto: \<descripción\>» | Creá la Tarea en Jira **pidiéndole confirmación primero**, y seguí el flujo normal con el issue creado |

En los tres casos, a partir de la fase 1 el flujo es idéntico: lo único que cambia es cómo se obtiene el
issue.

**Sólo se toman tareas del sprint activo.** Si no hay ninguna asignada a la persona en el sprint en
curso, **avisá y preguntá**: no tomes una de un sprint futuro ni del backlog por tu cuenta, aunque sea
la de mayor prioridad. Un sprint es un compromiso de qué entra y qué no.

**Antes de arrancar, fijate si ya está hecha.** Mirá si existe `specs/<clave>-*/` y si su rama o su PR
ya están mergeados. Una tarea puede volver a «Por hacer» porque alguien reorganizó el tablero, no
porque haya que rehacerla.

## Las 5 fases, en una línea cada una

El detalle completo, con artefactos y frenos, está en **`.agents/protocolo.md`**. Leelo antes de empezar.

0. **Preparación** — elegir o crear el issue, validar entorno, **poner los repos al día** y verificar que no haya cambios sin commitear.
1. **Spec** — de issue a `01-spec.md`: alcance, criterios de aceptación, preguntas abiertas.
2. **Plan** — `02-plan.md` (con Supuestos) y `04-tareas.md`.
3. **Implementar** — ramas, código y commits. El backend antes que los clientes.
4. **Verificar** — gates determinísticos y revisión independiente.
5. **Cierre** — push, PRs y transición en Jira. **Sólo con aprobación del usuario.**

### Reglas que no se negocian

- **El estado vive en disco, no en la conversación.** Cada fase arranca leyendo
  `specs/<tarea>/estado.json` y los artefactos de la fase anterior. Así el trabajo se retoma después de
  un corte de sesión. Registrá cada transición con `node .agents/scripts/estado.mjs`.
- **Declará con qué modelo trabajás** al crear la tarea (`--modelo "<tu modelo>"`). La herramienta se
  detecta sola; el modelo no. Es lo que permite después comparar cómo rindió cada IA
  (`node .agents/scripts/informe.mjs`). No lo adivines por otros: informá el tuyo.
- **Empezá siempre con los repos al día.** `node .agents/scripts/sincronizar.mjs` antes de planificar
  nada: se planifica leyendo el código del árbol de trabajo, y una copia vieja lleva a un plan viejo.
- **Nunca commitees ni pushees a `main`** en ninguno de los tres repos. Siempre rama de tarea.
- **Nunca pushees ni abras un PR sin que el usuario lo apruebe** en el checkpoint de cierre.
- **Una pregunta `BLOQUEANTE` en la spec corta el flujo.** No se planifica sobre huecos: se comenta la
  pregunta en el issue y se avisa al usuario.
- **El revisor no escribe código.** Ver `.agents/roles.md`.
- **Tablero y proyecto de Jira:** Se trabaja **siempre y exclusivamente** sobre el tablero **Planillero** (proyecto `PLAN`) en Jira. Cualquier consulta, selección, creación o transición de tareas se realiza en este tablero.
- Si un working tree tiene cambios sin commitear que no son tuyos, **pará y preguntá**. Nunca ramifiques
  sobre trabajo ajeno.

## Convenciones

**Idioma y estilo de código** — Todo el código (nombres de clases, interfaces, métodos, funciones,
variables, archivos fuente, tablas y columnas) se escribe en **inglés**. El nombre de variables y
símbolos debe seguir el estilo estándar del contexto donde se usa (por ejemplo: `camelCase` para variables
y métodos en Java y TypeScript, `PascalCase` para clases y componentes, `snake_case` para bases de datos
y columnas SQL, `SCREAMING_SNAKE_CASE` para constantes). Por el contrario, los comentarios explicativos
en el código (donde amerite explicar el qué o el por qué), la documentación conceptual, las specs, los
planes, los mensajes de commit y las descripciones de PR se escriben siempre en **español**.

> **Código anterior a esta convención.** Los tres esqueletos iniciales (PLAN-2, PLAN-3 y PLAN-4) se
> escribieron con nombres en español: `SaludController`, `obtenerSalud()`, `salud.service.ts`,
> `inicio.ts`, el endpoint `/salud`. Se decidió **aplicar la convención de acá en adelante** y no
> renombrarlos. Si tocás uno de esos archivos por otro motivo, podés pasarlo a inglés en el mismo PR;
> no abras un PR sólo para renombrar.

**Nombre de la empresa** — no se nombra a la empresa en ningún lado: ni en paquetes, namespaces,
dominios, títulos, textos de UI, comentarios ni datos. La única excepción son las direcciones de
correo, donde el dominio real es parte del dato. El paquete raíz del backend es `ar.com.planillero`,
por producto y no por empresa.

Las URLs de los repos (`github.com/matiaslameiro-surely/…`) son la excepción inevitable: el nombre
está en el owner de la cuenta. Son infraestructura, no una mención en el producto.

**Datos** — todo dato de ejemplo, fixture, seed o caso de prueba es **ficticio**. Nada de nombres de
clientes, legajos, sueldos ni registros reales, ni siquiera "de ejemplo". Si una spec llega con datos
que parecen reales, eso es una pregunta abierta, no un detalle a copiar.

**Ramas** — `PLAN-<n>-<slug>`, por ejemplo `PLAN-12-carga-de-planilla`. En una tarea que toca varios
repos, **la misma rama con el mismo nombre en todos**.

**Orden entre repos** — el backend va **siempre primero** porque es el que emite
`03-contrato-api.md`, y `frontend` y `backoffice` lo consumen. Los dos clientes son independientes
entre sí: ninguno espera al otro. Un cliente **nunca** inventa un endpoint que el contrato no
declara; si necesita algo que no está, se vuelve al backend.

**Commits** — `PLAN-<n>: <resumen en español>`. El prefijo hace que Jira enlace los commits solo.

**Ramas base** — salen siempre de `workspace.json` → `repos.<x>.ramaBase`, **nunca** del default de git:
esta máquina tiene `init.defaultbranch=master` y los repos usan `main`.

**Specs** — una carpeta por tarea en `specs/PLAN-<n>-<slug>/`, con los archivos numerados que define el
protocolo. Las plantillas están en `.agents/plantillas/`.

## Comandos

```bash
node .agents/scripts/init.mjs [--check]                        # entorno + configuración local
node .agents/scripts/cola.mjs consultar                        # el JQL a ejecutar con tu MCP de Jira
node .agents/scripts/cola.mjs elegir --yo <accountId>          # qué tarea sigue y por qué
node .agents/scripts/sincronizar.mjs [--solo-revisar]          # poner los repos al dia (fase 0)
node .agents/scripts/estado.mjs listar|crear|get|set|anotar    # estado de una tarea
node .agents/scripts/ramas.mjs estado|crear --tarea PLAN-12    # ramas espejadas
node .agents/scripts/verificar.mjs --tarea PLAN-12             # gates: compilar, tests, lint, tipos
node .agents/scripts/revisar.mjs --tarea PLAN-12 --repo <r>    # revisión independiente
node .agents/scripts/revisar.mjs --guardar --tarea PLAN-12 --repo <r> < revision.json
node .agents/scripts/pr.mjs --tarea PLAN-12 [--simular]        # crear los PRs
```

`cola.mjs` no consulta Jira por su cuenta: el acceso lo tenés vos (por MCP). El script emite el JQL y
después aplica el criterio de selección sobre lo que la consulta devolvió, para que ese criterio sea
determinístico y no dependa del ánimo del modelo.

Todo es Node y multiplataforma. No hace falta instalar dependencias: los scripts usan sólo la librería
estándar.

## La revisión

La **política** es del equipo y está en `workspace.json`: toda tarea pasa por una revisión independiente
antes del PR, y el resultado tiene que cumplir `.agents/schemas/revision.schema.json`.

El **motor** lo elige cada uno en su `workspace.local.json` (`revision.motores`, una lista ordenada).
Siempre existe el motor `anfitriona`, que significa «que revise la IA que ya está corriendo, con contexto
limpio». Quien no configure nada usa ese y no queda bloqueado.

Si te toca ser el revisor `anfitriona`: leé sólo el diff y la spec, **nunca** el razonamiento de quien
implementó, y respondé únicamente con el JSON del schema.

## Requisitos del entorno

| Requisito | Para qué |
|---|---|
| Node 20+ | Los scripts del harness y el toolchain de Expo |
| JDK 21 | Compilar y testear el backend. Se configura en `workspace.local.json`, porque varía por máquina |
| `gh` (GitHub CLI) autenticado | Crear los PRs |
| MCP de Atlassian | Leer y actualizar Jira |

`node .agents/scripts/init.mjs --check` te dice cuáles faltan.
