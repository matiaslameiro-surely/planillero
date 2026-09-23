# Tareas — PLAN-31

Alcance de un solo repo (`harness`): no hay contrato de API ni orden entre repos que respetar.

## harness

- [ ] `[harness]` Declarar el repo `harness` en `workspace.json` *(aplicado en fase 0: era condición para poder crear el estado de esta tarea)*
- [ ] `[harness]` Comprobar que sumarlo no rompe los barridos por defecto: `init.mjs --check`, `sincronizar.mjs --solo-revisar`, `verificar.mjs --tarea PLAN-31`
- [ ] `[harness]` `lib/revision.mjs`: `registrarRevisionEnEstado()`, único lugar que conoce la forma de la entrada (`n`, `repo`, `motor`, `motivo`, `verdict`, `bloqueantes`, `archivo`, `sha`, `ts`)
- [ ] `[harness]` `revisar.mjs`: resolver el SHA del repo revisado y llamar a la función en el camino `--guardar`
- [ ] `[harness]` `revisar.mjs`: llamarla también en el camino del motor externo, y reflejar en la salida JSON qué quedó registrado
- [ ] `[harness]` `pr.mjs`: tomar el motor de la entrada registrada, cruzándola por `archivo` con la última revisión del repo
- [ ] `[harness]` `pr.mjs`: comparar el SHA de la revisión contra el `HEAD` de la rama y advertir en el cuerpo si hay commits posteriores
- [ ] `[harness]` `protocolo.md` y `AGENTS.md`: documentar el registro automático, la advertencia de desfasaje y que el harness es un repo más del alcance

## Verificación

- [ ] Gates en verde en los repos del alcance (`node .agents/scripts/verificar.mjs --tarea PLAN-31`)
- [ ] Reproducidos los cinco escenarios de «Cómo se prueba» de `02-plan.md`
- [ ] Revisión independiente sin hallazgos `critical` ni `high`
- [ ] Cada criterio de aceptación de `01-spec.md` queda cubierto
