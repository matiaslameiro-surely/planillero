# PLAN-31 — Harness: la revisión no queda registrada en `estado.json` y el cuerpo del PR puede listar hallazgos ya corregidos

## Contexto y problema

El protocolo exige que el cuerpo de cada PR diga **qué motor hizo la revisión independiente**. Ese dato
sale de `estado.json` → `revisiones`, que `pr.mjs` consulta con `motorDeRevision()`. Pero **nadie escribe
ese array**: ni `revisar.mjs --guardar` (motor anfitrión) ni la rama de éxito de un motor externo lo tocan.
Los dos guardan el archivo `05-revision-<repo>-<n>.json` y terminan ahí. El resultado es que el PR sale
diciendo `**Revisión independiente:** \`desconocido\``, es decir, justo el dato que el flujo pide es el que
se pierde. En PLAN-18 hubo que escribir las entradas a mano antes de crear el PR.

El mismo array alimenta `informe.mjs`, que mide con qué IA se resolvió cada tarea: hoy informa
`revisionIndependiente: false` y sin veredictos para toda tarea cuyo estado no se haya editado a mano.

El segundo defecto es de honestidad del PR. `construirCuerpo()` toma la última revisión guardada y vuelca
sus hallazgos `medium` y `low` bajo «Hallazgos no bloqueantes», **sin ninguna relación con el estado del
código que se está por publicar**. Si el implementador los corrigió —cosa razonable cuando el arreglo es
de una línea, o cuando el entregable es un documento— el PR afirma que hay defectos abiertos que ya no
existen y manda a la revisión humana a buscar algo que no va a encontrar. En PLAN-18 pasó exactamente eso
y hubo que reescribir la sección con `gh pr edit` justo después de crear el PR.

Hay un tercer hueco, encontrado al preparar esta misma tarea y que es su condición de posibilidad: **el
repo del harness no figuraba en `workspace.json`**, así que no se lo podía declarar como alcance de una
tarea ni `sincronizar.mjs` lo ponía al día. Se descubrió con `main` divergido: 23 commits en `origin/main`
que no estaban en la copia local, sin que ningún script lo avisara.

## Alcance

**Repos que toca:** `harness`

Es una tarea sobre el propio andamiaje. No toca `backend`, `frontend` ni `backoffice`.

## Criterios de aceptación

1. Después de `revisar.mjs --guardar --tarea <T> --repo <R>`, el `estado.json` de la tarea tiene una
   entrada nueva en `revisiones` con, como mínimo: `n`, `repo`, `motor`, `motivo`, `verdict`,
   `bloqueantes` y el archivo de revisión al que corresponde.
2. Después de una revisión resuelta por un motor externo, `revisiones` tiene una entrada equivalente con
   el nombre real del motor (por ejemplo `codex`), no `anfitriona` ni `desconocido`.
3. Cada entrada registra **sobre qué commit corrió la revisión** (SHA del `HEAD` del repo revisado), para
   poder compararlo después contra el `HEAD` del momento del PR.
4. Guardar dos revisiones del mismo repo deja dos entradas, no una pisada ni duplicados de la misma:
   una entrada por archivo `05-revision-<repo>-<n>.json`.
5. El cuerpo generado por `pr.mjs` nombra el motor real de la revisión cuando la entrada existe.
6. Si el `HEAD` de la rama es **posterior** al commit sobre el que corrió la última revisión, el cuerpo
   del PR **no presenta los hallazgos como vigentes**: los presenta advirtiendo explícitamente que hubo
   commits después de la revisión y que pueden estar ya corregidos.
7. Si la revisión corrió sobre el mismo commit que se publica, el cuerpo se comporta como hoy: lista los
   hallazgos `medium`/`low` sin advertencia.
8. Sin regresiones sobre estados viejos: una tarea cuyo `estado.json` tenga `revisiones: []` o entradas
   sin SHA sigue generando un cuerpo de PR válido, con el comportamiento actual.
9. `workspace.json` declara el repo `harness`, de modo que `estado.mjs crear --alcance harness`,
   `sincronizar.mjs` y `verificar.mjs` lo contemplan sin errores.

## Fuera de alcance

- Cambiar `revision.schema.json`. El contrato de salida de un motor no se toca: lo que se agrega es
  metadata del harness en `estado.json`, no del resultado de la revisión.
- Marcar hallazgo por hallazgo como resuelto o vigente. La granularidad de esta tarea es la revisión
  completa contra el commit; distinguir hallazgo por hallazgo requeriría criterio y no es determinístico.
- Retro-completar las `revisiones` de las tareas ya cerradas.
- Corregir la divergencia de `main` en el repo del harness (23 commits remotos, 10 locales sin pushear).
  Es un problema de la copia de trabajo, no del código.
- Dar al harness un bloque de `verificacion` con gates propios (no tiene toolchain: no hay `package.json`).

## Preguntas abiertas

- [ ] `NO-BLOQUEANTE` — Ante la ausencia del `estado.json` de la tarea, `revisar.mjs --guardar` hoy no
  falla. Se asume que debe seguir sin fallar: guarda el archivo, avisa que no pudo anotar el estado y
  sale con `ok: true`. Registrar la revisión es un efecto secundario deseable, no la razón del comando.
- [ ] `NO-BLOQUEANTE` — Sumar el harness a `repos` lo incorpora al barrido por defecto de
  `sincronizar.mjs`. Durante una tarea en curso su árbol está sucio con los artefactos de la spec, así
  que va a aparecer en `requierenAtencion`. Se asume que ese ruido es aceptable, y preferible a que una
  copia desactualizada del harness pase desapercibida como pasó acá.
