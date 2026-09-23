# Plan técnico — PLAN-31

## Enfoque

Los dos defectos son la misma falta vista en dos momentos: **la revisión no deja rastro de en qué
condiciones se hizo**. Se resuelven con un único dato nuevo y un único lugar donde escribirlo.

El dato nuevo es el **SHA del commit sobre el que corrió la revisión**. Con eso, registrar el motor deja
de ser un apunte administrativo y pasa a ser una afirmación verificable: «este motor revisó *este*
código». Y `pr.mjs` puede comparar ese SHA contra el `HEAD` que está por publicar y saber si los
hallazgos que va a listar siguen describiendo el código o describen una foto vieja.

El lugar único es una función nueva en `lib/revision.mjs`, `registrarRevisionEnEstado()`, que
`revisar.mjs` llama en **sus dos caminos de éxito**: el de `--guardar` (motor anfitrión) y el del motor
externo. Hoy los dos terminan en `escribirJson(destino, revision)` y se van; el bug existe porque ese
paso está duplicado y a ninguna de las dos copias se le agregó el registro. Concentrarlo en una función
evita que la próxima incorporación de un camino vuelva a olvidarlo.

`pr.mjs` no gana lógica nueva de decisión: gana **una condición**. Si conoce el SHA de la revisión y no
coincide con el `HEAD` de la rama, los hallazgos se siguen listando —ocultarlos sería peor— pero
encabezados por la advertencia de que hubo commits posteriores. Si el SHA coincide, o si no lo conoce
(estados viejos), el cuerpo sale exactamente como hoy.

Por último, `workspace.json` declara el repo `harness`. Es lo que permite que esta tarea exista como
tarea del flujo, y de paso lo suma al barrido de `sincronizar.mjs`, que es lo que hubiera avisado de la
divergencia de `main` que encontramos al arrancar.

## Archivos a tocar

### harness/

| Archivo | Acción | Para qué |
|---|---|---|
| `workspace.json` | modificar | Declarar el repo `harness` (ruta `.`, rama base `main`, orden 0, sin gates). **Ya aplicado en fase 0**: sin esto no se podía crear el estado de esta tarea |
| `.agents/scripts/lib/revision.mjs` | modificar | `registrarRevisionEnEstado()`: lee `estado.json`, agrega la entrada y lo reescribe. Es el único lugar que conoce la forma de la entrada |
| `.agents/scripts/revisar.mjs` | modificar | Llamarla en los dos caminos de éxito; resolver el SHA del repo revisado; informar en la salida qué se registró |
| `.agents/scripts/pr.mjs` | modificar | Tomar el motor de la entrada registrada y advertir cuando la revisión es anterior al `HEAD` |
| `.agents/protocolo.md` | modificar | Fase 4: la revisión queda registrada sola; fase 5: qué dice el cuerpo si hay desfasaje |
| `AGENTS.md` | modificar | Dejar dicho que el harness es un repo más del alcance, con su propia rama y PR |

Seis archivos, por debajo del límite de 12.

## Decisiones técnicas

- **Registrar el SHA del `HEAD` del repo revisado, y compararlo contra el `HEAD` del momento del PR.**
  Se descartó **marcar cada hallazgo como resuelto o vigente** porque decidir si un hallazgo sigue
  aplicando exige criterio sobre el código, y la fase 4.1 del protocolo es explícitamente la capa
  determinística: un `rev-parse` no se equivoca, una evaluación de «¿esto ya está arreglado?» sí. La
  granularidad que queda es más gruesa, pero la afirmación que hace el PR es verdadera en todos los casos.

- **Vigencia por contenido, no por igualdad de SHA** *(surgió al implementar)*. En el repo del harness
  los artefactos de la tarea —incluida la revisión y `estado.json`— se commitean en la misma rama, así
  que registrar una revisión mueve el `HEAD` y toda revisión quedaría «vieja» por construcción. Se
  compara con `git diff --name-only <sha> HEAD`, excluyendo `specs/` sólo cuando la ruta del repo es
  `.`. Se descartó **comparar SHA contra SHA** por ese motivo, y **excluir `specs/` en todos los repos**
  porque en los de producto una carpeta con ese nombre sería código real. Si git no conoce el SHA (rama
  reescrita) se advierte igual: no se puede afirmar que sigue vigente.

- **Advertir, no ocultar.** Se descartó **omitir los hallazgos cuando la revisión quedó vieja** porque
  eso cambia un PR que miente por exceso («hay defectos abiertos») por uno que miente por omisión
  («no hay nada que mirar»), y el segundo es peor: la revisión humana no tiene forma de enterarse de que
  se le escondió algo. El PR dice lo que sabe y también lo que no sabe.

- **Una función en `lib/revision.mjs`, no código repetido en cada rama de `revisar.mjs`.**
  Se descartó **escribir el estado inline en los dos lugares** porque es exactamente la estructura que
  produjo el bug: dos caminos de éxito casi iguales, y el registro agregado a ninguno. Además
  `lib/revision.mjs` ya existe con este propósito —«separado de `revisar.mjs` para poder probarlo solo»—
  y no tiene dependencias fuera de la librería estándar.

- **Extender la forma de entrada que ya se escribía a mano, sin romperla.** Se descartó **inventar una
  forma nueva** porque `informe.mjs` y `pr.mjs` ya leen `motor` y `verdict` de las entradas que se
  cargaron a mano en PLAN-5, PLAN-10, PLAN-11 y PLAN-12; cambiar las claves dejaría esas tareas sin
  datos en el informe. Se agregan `archivo`, `sha` y `ts`, todos opcionales al leer.

- **El harness entra a `repos` sin marca especial.** Se descartó **una clave aparte fuera de `repos`**
  (o un flag que los barridos saltearan) porque obligaría a tocar `sincronizar.mjs`, `verificar.mjs`,
  `estado.mjs` y `pr.mjs` para enseñarles un segundo tipo de repo, cuando el harness se comporta como
  cualquier otro: tiene remoto, rama base, ramas de tarea y PRs. `verificar.mjs` ya resuelve solo el
  caso «sin toolchain» devolviendo `sin_gates`.

## Contrato de API

No aplica: el alcance no incluye ningún cliente.

## Supuestos

- `RIESGO` — **Sumar `harness` a `repos` no rompe ningún script.** Es el supuesto que puede invalidar
  todo lo demás, porque `Object.keys(cfg.repos)` es el alcance por defecto de `sincronizar.mjs` y
  `verificar.mjs`, y el fallback de `estado.mjs crear` sin `--alcance`. Verificado a mano sobre el
  código: `verificar.mjs` devuelve `sin_gates` para un repo sin `package.json` ni wrappers, y
  `sincronizar.mjs` con `ruta: "."` opera sobre el repo actual, que tiene `.git` y remoto. Se confirma
  corriendo los dos scripts antes de tocar nada más.
- `RIESGO` — **`ruta: "."` es una ruta válida para todos los scripts.** Todos hacen
  `path.join(RAIZ, repo.ruta)`, que con `"."` resuelve a `RAIZ`. Si alguno usara la ruta para armar un
  texto (`./${repo.ruta}` da `./.`), sería cosmético y no funcional; igual se revisa al implementar.
- El árbol de trabajo del harness va a estar sucio durante toda la tarea, porque los artefactos de la
  spec se escriben mientras se trabaja. Por eso la rama se creó con `git` directo y no con
  `ramas.mjs crear`, que se niega a ramificar sobre un árbol sucio. Es correcto que se niegue; sólo que
  para el repo del harness el orden natural es ramificar primero.
- Nadie más está trabajando ahora mismo sobre `origin/main` del harness. La rama sale de `origin/main`,
  no del `main` local, que está divergido.
- La `n` de una entrada es el número del archivo `05-revision-<repo>-<n>.json`, no un contador
  independiente. Es lo que permite cruzar entrada y archivo.

## Cómo se prueba

El harness no tiene suite de tests: la verificación es reproducir los escenarios del issue sobre esta
misma tarea, que toca el repo `harness` y por lo tanto se revisa y se publica con el código nuevo.

1. **Criterios 1, 3, 4** — correr la revisión de esta tarea y confirmar que `estado.json` quedó con la
   entrada, con su `motor`, su `archivo` y su `sha`. Guardar una segunda revisión y confirmar que quedan
   dos entradas y dos archivos.
2. **Criterio 2** — la cadena configurada es `codex` → `anfitriona`. Si `codex` responde, la entrada
   tiene que decir `codex`; si no, `anfitriona` con el `motivo` del fallo. Los dos casos son válidos: lo
   que se verifica es que el nombre registrado sea el real.
3. **Criterios 5, 6, 7** — `pr.mjs --tarea PLAN-31 --simular` y leer el cuerpo generado en
   `specs/PLAN-31-*/.tmp/pr-harness.md`. Primero con la revisión al día: tiene que nombrar el motor y
   listar los hallazgos sin advertencia. Después, con un commit encima, tiene que aparecer la
   advertencia de desfasaje. `--simular` no crea nada en GitHub.
4. **Criterio 8** — `pr.mjs --simular` sobre una tarea vieja con `revisiones: []` (`PLAN-15`) y sobre
   una con entradas escritas a mano y sin SHA (`PLAN-11`): los dos cuerpos tienen que salir sin error y
   con el comportamiento de hoy.
5. **Criterio 9** — `init.mjs --check`, `sincronizar.mjs --solo-revisar` y `verificar.mjs --tarea
   PLAN-31`, los tres sin errores y contemplando el repo `harness`.
