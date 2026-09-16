# Tareas — <CLAVE>

> Plantilla de la fase 2. Borrá estas citas al completarla.
>
> Checklist en **orden de dependencia**, no de importancia. Cada ítem con prefijo de repo.
> Todo lo de `[backend]` va antes que lo de `[frontend]`: el contrato de API se define en el
> backend y el frontend lo consume.
>
> Marcá `[x]` a medida que se completan: es lo que permite retomar la tarea sin releer el diff.

## backend

- [ ] `[backend]`
- [ ] `[backend]` Emitir `03-contrato-api.md` *(obligatorio si el alcance es `ambos`)*

## frontend

- [ ] `[frontend]` Leer `03-contrato-api.md` antes de empezar
- [ ] `[frontend]`

## Verificación

- [ ] Gates en verde en los repos del alcance (`node .agents/scripts/verificar.mjs`)
- [ ] Revisión independiente sin hallazgos `critical` ni `high`
- [ ] Cada criterio de aceptación de `01-spec.md` queda cubierto
