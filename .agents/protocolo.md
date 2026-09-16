# Protocolo SDD

Definición canónica del ciclo de trabajo. **Esta es la única definición de las fases**: si tu herramienta
tiene comandos propios, que la importen o la citen, nunca que la copien. Si el flujo cambia, cambia acá.

Reglas transversales, válidas en todas las fases:

- **El estado vive en disco.** Cada fase arranca leyendo `specs/<tarea>/estado.json` y los artefactos de
  la fase anterior. La conversación no es fuente de verdad.
- **Registrá cada transición** con `node .agents/scripts/estado.mjs set --tarea <T> --fase <F> --estado <E>`.
  Una transición que es una llamada observable no se saltea sola.
- **No avances de fase si la anterior no quedó en `ok`.**
- Todos los artefactos se escriben en español.

---

## Fase 0 — Preparación

**Objetivo:** tener un issue, un entorno sano y un lugar donde trabajar.

1. **Conseguir el issue**, según cómo lo pidió el usuario:
   - «la próxima tarea» → `node .agents/scripts/cola.mjs`. **Decile al usuario qué eligió y por qué**
     antes de seguir.
   - «PLAN-12» → ese issue.
   - una descripción en texto → **pedí confirmación** y creá la Tarea en el proyecto `PLAN`.
2. **Validar el entorno**: `node .agents/scripts/init.mjs --check`. Si falta algo que bloquea (JDK para
   una tarea de backend, `gh` para poder cerrar), decilo ahora y no al final.
3. **Verificar que los working trees estén limpios** en los repos del alcance. Si hay cambios sin
   commitear que no son tuyos → **pará y preguntá**. Nunca ramifiques sobre trabajo ajeno.
4. **¿Ya existe `specs/PLAN-<n>-*/`?** Entonces esto es una reanudación: leé `estado.json` y saltá
   directo a la fase que corresponda. No rehagas trabajo hecho.
5. Crear la carpeta `specs/PLAN-<n>-<slug>/` y el `estado.json` inicial.
6. Transicionar el issue a **En curso**. Si estaba sin asignar, autoasignárselo al usuario: así dos
   personas no toman la misma tarea.

**Salida:** `specs/<tarea>/estado.json`, `00-issue.json`.

---

## Fase 1 — Especificación

**Rol:** Analista (ver `roles.md`). **Entrada:** el issue. **Salida:** `01-spec.md`.

Producí `01-spec.md` a partir de la plantilla `.agents/plantillas/spec.md`, con:

- **Contexto y problema** — qué se quiere y por qué. Si el issue es escueto, decilo; no lo rellenes con
  invención.
- **Alcance** — exactamente uno de: `backend`, `frontend`, `ambos`. Esto define el resto del flujo.
- **Criterios de aceptación** — numerados y **verificables**. "Funciona bien" no es un criterio;
  "al guardar una planilla sin horas devuelve 400 con el detalle del campo" sí lo es.
- **Fuera de alcance** — lo que explícitamente no se hace. Evita que la implementación se expanda sola.
- **Preguntas abiertas** — cada una marcada `BLOQUEANTE` o `NO-BLOQUEANTE`.

> **Freno duro:** si hay al menos una pregunta `BLOQUEANTE`, **parás acá**. Comentala en el issue de Jira
> y avisale al usuario. No se planifica ni se implementa sobre huecos.

Escribí el `alcance` en `estado.json`: es lo que determina en qué repos se trabaja.

---

## Fase 2 — Plan técnico

**Entrada:** `01-spec.md` y el código de los repos del alcance. **Salida:** `02-plan.md`, `04-tareas.md`.

Explorá el código **antes** de planificar: buscá lo que ya existe y reusalo en vez de proponer código
nuevo. Después escribí:

**`02-plan.md`** (plantilla `.agents/plantillas/plan.md`):
- Enfoque, en prosa breve.
- Archivos a crear o modificar, agrupados por repo.
- Decisiones técnicas, cada una con la alternativa que descartaste y por qué.
- **Supuestos** — sección obligatoria. Todo lo que estás dando por cierto sin haberlo confirmado. Marcá
  `RIESGO` los que, si están mal, invalidan el plan.
- Si el alcance es `ambos`: el contrato de API a alto nivel (endpoints, verbos, forma de los datos). El
  detalle definitivo lo emite el backend en la fase 3.

**`04-tareas.md`** (plantilla `.agents/plantillas/tareas.md`): checklist en orden de dependencia, cada
ítem con prefijo `[backend]` o `[frontend]`.

> **Checkpoint.** Presentale el plan al usuario y esperá su aprobación si se cumple cualquiera de estas
> condiciones:
> - `"plan"` está en `flujo.checkpoints` de `workspace.json`;
> - el plan supera `limiteArchivosSinCheckpoint` archivos o `limiteTareasSinCheckpoint` tareas;
> - hay algún supuesto marcado `RIESGO`.
>
> Las dos últimas condiciones **fuerzan el checkpoint aunque la configuración no lo pida**. Son la
> defensa contra implementar mucho sobre una spec mal entendida.

---

## Fase 3 — Implementación

**Roles:** Implementador backend y, después, Implementador frontend.

1. **Crear las ramas**: `node .agents/scripts/ramas.mjs crear --tarea PLAN-12`. Crea
   `PLAN-<n>-<slug>` desde la rama base en **cada repo del alcance**, con el mismo nombre en todos.

2. **El backend primero, nunca en paralelo.** Entradas del rol: `01-spec.md`, `02-plan.md`, su parte
   de `04-tareas.md`. **Salida obligatoria si el alcance incluye algún cliente:** `03-contrato-api.md`
   con endpoints, verbos, request y response de ejemplo, y códigos de error.

3. **Los clientes después** (`frontend`, `backoffice`), con `03-contrato-api.md` como entrada
   obligatoria. Este orden no es preferencia: si un cliente va primero o en paralelo, inventa endpoints
   que después no existen, y el problema aparece recién en integración.

   **Los clientes son independientes entre sí**: ninguno espera al otro y el orden entre ellos no
   importa. Lo que no puede pasar es que uno defina algo que el contrato no declara — si necesita algo
   que no está, se vuelve al backend y se actualiza el contrato para todos.

4. Commits con el formato `PLAN-<n>: <resumen>`. Registrá el SHA de cada uno en `estado.json`.

El orden sale de `repos.<x>.orden` en `workspace.json`, y el repo que emite el contrato está marcado
con `produceContratoApi`. Si el alcance es de un solo repo, se saltean los demás roles: no hay caso
especial que manejar, se itera sobre `estado.alcance`.

---

## Fase 4 — Verificación

Dos capas, en este orden. La primera es determinística; la segunda usa criterio.

**4.1 Gates** — `node .agents/scripts/verificar.mjs --tarea PLAN-12`
Compila, tests, lint y tipos según el repo. Si algo falla → volvé a la fase 3 con el detalle del fallo e
incrementá `iteracion`.

**4.2 Revisión independiente** — `node .agents/scripts/revisar.mjs --tarea PLAN-12 --repo <repo>`
El script devuelve **un JSON por stdout** y termina con código 0 salvo que él mismo crashee. **Ramificá
por el campo `motor`, nunca por el exit code:**

- `motor` es un motor externo → ya tenés la revisión, y el archivo quedó guardado.
- `motor` es `"anfitriona"` → **revisala vos**, con contexto limpio: leé sólo el diff
  (`git diff <ramaBase>...HEAD`) y `01-spec.md`, **nunca** el razonamiento de quien implementó.
  Respondé únicamente con el JSON del schema y guardalo en `specs/<tarea>/05-revision-<n>.json`.
  Contale al usuario en una línea por qué se usó el motor anfitrión (campo `motivo`) y, si aplica, desde
  cuándo se puede reintentar con el externo (`reintentarDespuesDe`).

En los dos casos el artefacto final es el mismo archivo con el mismo formato.

**4.3 Qué hacer con los hallazgos**
- Severidad en `revision.severidadesQueBloquean` (`critical`, `high`) → volvé a la fase 3 con esos
  hallazgos como entrada, e incrementá `iteracion`.
- `medium` y `low` → no bloquean: van al cuerpo del PR para la revisión humana.

**4.4 Hallazgos falsos**

Un revisor se puede equivocar, y hay un modo de error que se repite: **corre sin acceso a red**, así
que no puede comprobar si una versión, un paquete o una API existen, y tiende a reportar como
inexistente lo que simplemente no conoce por ser posterior a su entrenamiento. Los hallazgos sobre
disponibilidad de dependencias hay que verificarlos siempre antes de actuar.

No aceptes ni descartes un hallazgo bloqueante por criterio propio: **reproducilo**. Corré el
escenario concreto que el hallazgo describe, con las condiciones que plantea.

- **Se reproduce** → es real. Volvé a la fase 3.
- **No se reproduce** → escribí `05-revision-<repo>-<n>-refutacion.md` al lado de la revisión, con el
  hallazgo citado, el comando exacto y su salida, y la causa probable del error. Recién entonces
  seguís.

Un hallazgo refutado **no se borra ni se edita**: la revisión original queda como está y la refutación
va al lado. El cuerpo del PR menciona que hubo uno, para que la revisión humana pueda discrepar.

Refutar tiene que costar más que obedecer: si no lográs reproducir el escenario pero tampoco podés
demostrar que no ocurre, tratá el hallazgo como real.

> **Tope duro:** si `iteracion` supera `flujo.maxIteracionesVerificacion`, **pará y preguntá**. Un
> problema que no se resuelve en dos vueltas no se resuelve en diez: consume tokens hasta que alguien
> mire la pantalla.

---

## Fase 5 — Cierre

**Esta fase requiere aprobación explícita del usuario. Son dos preguntas separadas, no una.**

1. **Preguntá:** resumen del diff (archivos y líneas por repo), veredicto de la revisión y qué motor la
   hizo. ¿Pushear y crear los PRs?
2. Con el sí: `git push -u origin <rama>` en cada repo del alcance y después
   `node .agents/scripts/pr.mjs --tarea PLAN-12`.
   - El cuerpo de cada PR lleva: link al issue, resumen de la spec, criterios de aceptación como
     checklist, hallazgos `medium`/`low`, y **qué motor hizo la revisión**.
   - Si el alcance es `ambos`: el PR del frontend lleva `Depende de: <URL del PR de backend>`, y después
     se actualiza el del backend con el link inverso.
3. **Preguntá de nuevo:** PRs creados, con sus URLs. ¿Transicionar el issue a **En revisión**?
4. Con el sí: transicionar y comentar en el issue con los links de los PRs y el resumen de la revisión.
5. Marcá la tarea como cerrada en `estado.json`.
