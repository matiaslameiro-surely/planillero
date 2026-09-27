# Verificación manual — PLAN-68

El harness no tiene gates (`verificar.mjs` responde `sin_gates`), así que se probó a mano con los repos
reales del workspace, el 2026-09-27.

## Estado del workspace durante la prueba

| Repo | Situación | Motivo esperado |
|---|---|---|
| harness | rama `PLAN-68-…` con el cambio sin commitear y specs sin trackear | `working_tree_sucio` |
| backend | `main`, limpio y al día | ninguno: no requiere atención |
| frontend | rama `PLAN-78-…` con 1 commit propio | `rama_con_trabajo` |
| backoffice | rama `PLAN-75-…` con 2 commits propios | `rama_con_trabajo` |

## Antes del cambio (`--solo-revisar`)

```
requierenAtencion: [
 "harness: Tiene 2 archivo(s) sin commitear. Se trajo lo remoto pero no se movió nada.",
 "backend: undefined",
 "frontend: Estás en \"PLAN-78-…\" con 1 commit(s) que no están en main. …",
 "backoffice: Estás en \"PLAN-75-…\" con 2 commit(s) que no están en main. …"
]
```

El backend, sano, aparece con `undefined` (el defecto del issue).

## Después del cambio

`node .agents/scripts/sincronizar.mjs --solo-revisar`:

```
backend main limpio=true detras=0 adelante=0 solo_revisar | Al día con origin/main.
requierenAtencion: [
 "harness: Tiene 3 archivo(s) sin commitear. Se trajo lo remoto pero no se movió nada.",
 "frontend: Estás en \"PLAN-78-…\" con 1 commit(s) que no están en main. …",
 "backoffice: Estás en \"PLAN-75-…\" con 2 commit(s) que no están en main. …"
]
```

`node .agents/scripts/sincronizar.mjs` (sin `--solo-revisar`): mismo `requierenAtencion`; el backend
queda `ya_estaba_al_dia`.

Dos escenarios más, armados sobre el backend y deshechos al terminar (quedó en `main...origin/main`):

- **Atrasado** (`git switch --detach HEAD~1`), con `--solo-revisar --repo backend`:
  `detalle: En "HEAD", sin commits propios: sin --solo-revisar volvería a main. Está 2 commit(s) detrás
  de origin/main. Sin --solo-revisar se actualizaría.` — `requierenAtencion: []`
- **Rama de tarea sin commits propios** (`git switch -c PLAN-68-prueba-temporal`), con
  `--solo-revisar --repo backend`: `detalle: En "PLAN-68-prueba-temporal", sin commits propios: sin
  --solo-revisar volvería a main. Al día con origin/main.` — `requierenAtencion: []`

## Criterios

1. Repo limpio y al día fuera de `requierenAtencion` con `--solo-revisar`: backend. ✔
2. Cambios sin commitear y rama con commits propios siguen apareciendo con su detalle, con y sin
   `--solo-revisar`: harness, frontend y backoffice. ✔
3. Ninguna entrada dice `undefined`. ✔
4. El `detalle` de `--solo-revisar` dice si el repo está al día o cuántos commits le faltan. ✔

## Después de atender la revisión 1

La revisión marcó dos `medium` y un `low` (los mensajes de `--solo-revisar` anticipaban mal lo que haría la
sincronización real). Se probaron sobre el backend, con `--solo-revisar --repo backend`, y se dejó en
`main...origin/main` al terminar:

| Escenario | Resultado |
|---|---|
| HEAD desacoplado (`switch --detach HEAD~1`) | `solo_revisar` — «Con HEAD desacoplado y sin commits propios: sin --solo-revisar volvería a main. Está 2 commit(s) detrás de origin/main. Sin --solo-revisar se actualizaría.» |
| `main` con 1 commit local y 2 detrás | `solo_revisar` — «Tiene 1 commit(s) locales en main sin publicar y está 2 detrás de origin/main: la sincronización fallaría (el pull no avanza en línea recta).» |
| `main` con 1 commit local, al día | `solo_revisar` — «Tiene 1 commit(s) locales en main sin publicar.» |
| `ramaBase` inexistente (`no-existe`, cambio temporal en workspace.json) | `ok: false`, `rama_base_no_disponible`, `detras`/`adelante` null — «No se pudo comparar con origin/no-existe. …»; el script sale con `ok: false` |
| Limpio en `main` | `solo_revisar` — «Al día con origin/main.» |

En ninguno aparece `undefined` y ninguno de los repos sanos entra en `requierenAtencion`.

## Después de atender la revisión 2

La revisión 2 marcó que, en una rama de tarea, el detalle medía HEAD y no la `main` local (que es la que
actualiza el pull), y que una base divergente sólo se avisaba en el texto. Ahora se mide la base local y
la divergencia es el motivo `base_divergente`, que entra en `requierenAtencion`. Pruebas sobre el backend
con `--solo-revisar --repo backend`, dejándolo en `main...origin/main` y sin la rama temporal al final:

| Escenario | Motivo | ¿En `requierenAtencion`? | Detalle |
|---|---|---|---|
| Rama de tarea al día; `main` local 2 atrás | `solo_revisar` | no | «… volvería a main. main está 2 commit(s) detrás de origin/main. Sin --solo-revisar se actualizaría.» |
| Rama de tarea al día; `main` local divergente | `base_divergente` | sí | «main tiene 1 commit(s) locales sin publicar y está 2 detrás de origin/main: la sincronización fallaría …» |
| En `main` divergente | `base_divergente` | sí | ídem |
| En `main` con 1 commit local, al día | `solo_revisar` | no | «main tiene 1 commit(s) locales sin publicar.» |
| HEAD desacoplado; `main` local al día | `solo_revisar` | no | «Con HEAD desacoplado y sin commits propios: sin --solo-revisar volvería a main. main está al día con origin/main.» |
| `ramaBase` inexistente | `rama_base_no_disponible`, `ok: false` | no (es un error) | «No se pudo comparar con origin/no-existe: fatal: ambiguous argument 'HEAD..origin/no-existe' … Revisá que la rama base exista …» |
| Limpio en `main` | `solo_revisar` | no | «main está al día con origin/main.» |

Sobre el workspace real, el backoffice (en la rama de PLAN-75, ya mergeada) dice ahora «main está 5
commit(s) detrás de origin/main», que es lo que el pull traería; antes decía 3, medido contra HEAD.

## Después de atender la revisión 3

Dos `low`: el JSON de `--solo-revisar` mostraba sólo los contadores medidos desde HEAD, y `contar` podía
devolver `NaN` si git mezclaba un warning en la salida (por ejemplo, un tag llamado igual que la rama).

- Los resultados de `--solo-revisar` exponen `baseLocal: { detras, adelante }`, y si no se puede medir
  la base local el repo sale con `rama_base_no_disponible` en vez de «al día».
- `contar` devuelve `null` si la salida no es un entero, y la base local se mide con refs completas
  (`refs/heads/…`, `refs/remotes/origin/…`), que no son ambiguas.
- `commitsTraidos` de la sincronización real cuenta `antes..despues` en vez de reusar `detras`.
- Al probar el tag ambiguo apareció que `rev-parse --abbrev-ref HEAD` devuelve `heads/main` en ese caso;
  la rama actual se toma ahora de `git branch --show-current`.

| Escenario (backend) | Resultado |
|---|---|
| Tag local `main` + rama `main` al día, `--solo-revisar` | `main`, `baseLocal {0,0}`, «main está al día con origin/main.» (antes: rama `heads/main`) |
| Rama de tarea al día, `main` local 2 atrás, `--solo-revisar` | `detras 0` (HEAD), `baseLocal {detras 2}`, «… main está 2 commit(s) detrás …» |
| La misma situación, **sin** `--solo-revisar` | `actualizado`, `commitsTraidos: 2` (antes habría informado 0, el `detras` de HEAD) |
| HEAD desacoplado | «Con HEAD desacoplado y sin commits propios: …» |

El backend quedó en `main...origin/main`, sin el tag ni la rama temporal.
