# Tareas — <CLAVE>

> Plantilla de la fase 2. Borrá estas citas al completarla.
>
> Checklist en **orden de dependencia**, no de importancia. Cada ítem con prefijo de repo
> (`[backend]`, `[frontend]`, `[backoffice]`). Todo lo de `[backend]` va antes que lo de los
> clientes: el contrato de API se define en el backend y ellos lo consumen. Entre clientes no hay
> orden: son independientes.
>
> Marcá `[x]` a medida que se completan: es lo que permite retomar la tarea sin releer el diff.

## backend

- [ ] `[backend]`
- [ ] `[backend]` Emitir `03-contrato-api.md` *(obligatorio si el alcance incluye algún cliente)*

## frontend *(app móvil)*

- [ ] `[frontend]` Leer `03-contrato-api.md` antes de empezar
- [ ] `[frontend]`

## backoffice *(web)*

- [ ] `[backoffice]` Leer `03-contrato-api.md` antes de empezar
- [ ] `[backoffice]`

## Verificación

- [ ] Gates en verde en los repos del alcance (`node .agents/scripts/verificar.mjs`)
- [ ] Revisión independiente sin hallazgos `critical` ni `high`
- [ ] Cada criterio de aceptación de `01-spec.md` queda cubierto
