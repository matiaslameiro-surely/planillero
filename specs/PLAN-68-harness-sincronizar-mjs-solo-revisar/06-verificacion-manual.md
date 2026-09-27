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
