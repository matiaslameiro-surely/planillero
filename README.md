# Planillero — workspace

Entorno de desarrollo asistido por IA para Planillero. Toma tareas de Jira, las lleva por un ciclo de
**desarrollo guiado por especificación (SDD)** y las cierra con un PR verificado.

**Funciona con cualquier asistente de IA.** No hay nada acá atado a una herramienta puntual: cada uno
usa la que prefiera y configura la suya localmente.

Acá no hay código de producto. El código vive en tres repos que se clonan adentro de esta carpeta:

| Carpeta | Repo | Stack | Qué es |
|---|---|---|---|
| `backend/` | `planillero-backend` | Java + Spring Boot | La API |
| `frontend/` | `planillero-frontend` | React Native + Expo | App móvil |
| `backoffice/` | `planillero-backoffice` | Angular | Backoffice web |

## Puesta en marcha

### 1. Requisitos

| | Para qué | |
|---|---|---|
| **Node 22.22.3+ o 24.15+** | Los scripts del harness y los tres toolchains | [nodejs.org](https://nodejs.org) |
| **JDK 21** | Compilar y testear el backend | `winget install EclipseAdoptium.Temurin.21.JDK` |
| **GitHub CLI** | Crear los PRs | `winget install GitHub.cli`, después `gh auth login` |
| **MCP de Atlassian** | Leer y actualizar Jira | Se configura en tu herramienta de IA |

Node tiene que ser **22.22.3+ o 24.15+**: es el rango que declara Angular 22, el más estricto de los
tres repos. Un Node 23, o un 22 o 24 anterior a esos, no puede construir el backoffice. El repo del
backoffice lo fija en su `engines` y en un `.nvmrc`.

En macOS o Linux, reemplazá `winget` por `brew install temurin@21 gh`.

### 2. Clonar

```bash
git clone https://github.com/matiaslameiro-surely/planillero.git
cd planillero

git clone https://github.com/matiaslameiro-surely/planillero-backend.git  backend
git clone https://github.com/matiaslameiro-surely/planillero-frontend.git  frontend
git clone https://github.com/matiaslameiro-surely/planillero-backoffice.git backoffice
```

Las tres están en `.gitignore`: son repos independientes, con su propio historial.

### 3. Configurar tu máquina

```bash
node .agents/scripts/init.mjs
```

Detecta tu entorno, encuentra tu JDK y las CLIs de IA que tengas instaladas, y escribe
`workspace.local.json` — **tu** configuración, que no se versiona ni se comparte.

Para ver el diagnóstico sin escribir nada: `node .agents/scripts/init.mjs --check`.

## Cómo se usa

Abrí tu asistente de IA en esta carpeta y decile una de estas tres cosas:

```
agarrá la próxima tarea y hacela
hacé PLAN-12
hacé esto: agregar un filtro por fecha al listado de planillas
```

Tu asistente lee `AGENTS.md`, sigue el protocolo de `.agents/protocolo.md` y ejecuta el ciclo completo:
especificación → plan → implementación → verificación. **Frena y te pregunta antes de pushear y antes
de tocar Jira.**

Todo lo que produce queda en `specs/PLAN-<n>-<slug>/`: la spec, el plan, las tareas, el resultado de la
verificación y el de la revisión.

## La revisión

Toda tarea pasa por una **revisión independiente** antes del PR. Eso es política del equipo y está en
`workspace.json`.

**Con qué motor la hace cada uno es decisión personal** y vive en tu `workspace.local.json`:

```jsonc
{ "revision": { "motores": ["codex", "anfitriona"] } }
```

Se prueban en orden hasta que uno responda. `anfitriona` significa «que revise la IA que ya estás
usando, con contexto limpio», y está siempre disponible: **si no configurás nada, igual funciona**.

Para cambiar tu cadena: `node .agents/scripts/init.mjs --motores <lista separada por comas>`.

## Qué se versiona y qué no

La regla que mantiene esto usable por todo el equipo:

> Se versiona **qué** hay que hacer. **Con qué IA** lo hace cada uno es configuración local.

| Se versiona | Nunca |
|---|---|
| `AGENTS.md`, `.agents/`, `workspace.json`, `specs/` | `workspace.local.json` |
| | `.claude/`, `.codex/`, `.cursor/`, `.gemini/`… |
| | `backend/`, `frontend/`, `backoffice/` |

Antes de agregar algo a `workspace.json`, preguntate si vale para todo el equipo. Si es una ruta de tu
máquina o una preferencia tuya, va en el local. `init.mjs` avisa si se te filtró algo personal al
archivo compartido.

## Comandos

```bash
node .agents/scripts/init.mjs [--check] [--motores a,b]      # entorno y configuración local
node .agents/scripts/cola.mjs consultar                      # qué consultar en Jira
node .agents/scripts/cola.mjs elegir --yo <accountId>        # qué tarea sigue, y por qué
node .agents/scripts/sincronizar.mjs [--solo-revisar]        # poner los repos al día antes de empezar
node .agents/scripts/estado.mjs listar                       # tareas en curso y su fase
node .agents/scripts/ramas.mjs crear --tarea PLAN-12         # la misma rama en los repos del alcance
node .agents/scripts/verificar.mjs --tarea PLAN-12           # compilar, tests, lint, tipos
node .agents/scripts/revisar.mjs --tarea PLAN-12 --repo backend   # revisión independiente
node .agents/scripts/pr.mjs --tarea PLAN-12 [--simular]      # crear los PRs
node .agents/scripts/informe.mjs [--md|--json]               # qué se hizo, con qué IA y qué costó
node .agents/scripts/guardia-push.mjs --instalar             # reinstalar el hook pre-push
```

Todos hablan JSON por stdout y usan sólo la librería estándar de Node: no hay que instalar nada.

### El registro de lo hecho

Cada tarea deja su carpeta en `specs/PLAN-<n>-<slug>/` con la spec, el plan, las tareas, la
verificación y las revisiones. El `estado.json` de esa carpeta guarda además **con qué IA se
resolvió** —herramienta y modelo— y **qué motor la revisó**.

`node .agents/scripts/informe.mjs` recorre todo eso y arma el análisis: qué tareas se hicieron, quién
las implementó, quién las revisó, cuántos hallazgos hubo y cuánto tardaron. No hay archivo de bitácora
aparte a propósito: un registro paralelo se desincroniza del estado real.

### El guardia de push

`init.mjs` instala en cada repo de producto un hook `pre-push` de git que **bloquea el push directo
a `main`**. Es un hook de git y no de una herramienta de IA, así que protege igual a todo el equipo y
también cuando pusheás a mano. Si alguna vez necesitás saltearlo a propósito: `git push --no-verify`.

## Documentación

| Archivo | Qué contiene |
|---|---|
| [`AGENTS.md`](AGENTS.md) | Las reglas. Lo lee tu asistente de IA al abrir la carpeta |
| [`.agents/protocolo.md`](.agents/protocolo.md) | Las 5 fases en detalle, con sus artefactos y sus frenos |
| [`.agents/roles.md`](.agents/roles.md) | Los 4 roles y qué contexto debe y no debe tener cada uno |
| [`.agents/plantillas/`](.agents/plantillas/) | Plantillas de spec, plan, tareas, contrato de API y PR |
