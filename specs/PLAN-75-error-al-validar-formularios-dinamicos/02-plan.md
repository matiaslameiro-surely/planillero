# Plan técnico — PLAN-75

## Enfoque

Construir la instancia de AJV con la clase `Ajv2020` (`ajv/dist/2020`), que registra el meta-schema y el
vocabulario de Draft 2020-12, en los dos clientes. La API pública es la misma (`compile`, `errors`,
`addFormats`), así que el resto del código de validación no cambia. Se agrega un test por repo con un
schema que declara `$schema` 2020-12 y cubre las reglas que usan las plantillas del seed.

## Archivos a tocar

### frontend/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/forms/validation.ts` | modificar | Importar `Ajv` desde `ajv/dist/2020` (y los tipos desde ahí) |
| `src/forms/validation.test.ts` | crear | Criterios 1, 2, 3 y 5 |

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/forms/validation.service.ts` | modificar | Mismo cambio de import |
| `src/app/forms/__tests__/validation.service.spec.ts` | crear | Criterios 4 y 5 |

## Decisiones técnicas

- **Usar `Ajv2020` y no quitar el `$schema` antes de compilar** — Se descartó borrar la clave `$schema` en
  el cliente porque escondería el problema: AJV seguiría validando con la semántica de Draft-07, que
  difiere de 2020-12 en keywords como `items`/`prefixItems` o `$defs`. Con `Ajv2020` el cliente valida con
  el mismo draft que el backend.
- **Registrar además el meta-schema Draft-07 en la misma instancia** — Se descartó: ningún schema del
  contrato declara Draft-07, y sumar drafts que nadie usa agranda la superficie sin beneficio.
- **Arreglar el backoffice en la misma tarea** — Se descartó abrir otro issue: es el mismo defecto y la
  misma línea de código; hoy está latente sólo porque el backoffice no valida formularios completos.

## Supuestos

- `ajv/dist/2020` resuelve igual en Metro (móvil) y en el builder de Angular: el paquete `ajv` 8.20.0 no
  declara `exports`, así que la ruta profunda es válida en los dos. Se comprueba con los gates (el build del
  backoffice y los tests del móvil).
- AJV genera el código del validador con `new Function` también con `Ajv2020`, igual que con la clase por
  defecto: no cambia nada respecto de la CSP del backoffice (PLAN-59) ni del motor JS del móvil.

## Cómo se prueba

- `npm test` en los dos repos: los tests nuevos compilan un schema con `$schema` 2020-12 (fallan con la
  clase anterior, se verificó a mano con Node) y validan datos válidos e inválidos.
- Gates de `verificar.mjs` (lint, tipos/build y tests).
