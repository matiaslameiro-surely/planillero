# Plan técnico — PLAN-25

## Enfoque

Tres movimientos, todos en estilos:

1. **Tokens nuevos en `_variables.scss`**, cada uno con su contraste calculado:

   | Token | Valor | Contraste | Reemplaza a |
   |---|---|---|---|
   | `$color-text-muted` | `#5b6778` | 5,74:1 sobre blanco, 5,48:1 sobre `#f7fafc` | `#94a3b8`, `#718096`, `opacity` |
   | `$color-status-ok` | `#15803d` | 5,02:1 sobre blanco, 4,57:1 sobre `#dcfce7` | `#16a34a` |
   | `$color-status-alert` | `#b91c1c` | 6,47:1 sobre blanco, 5,89:1 sobre `#fff1f2` | `#ef4444` |

   Los errores de campo pasan a `$color-error` (`#c0392b`, 5,44:1), que ya existía.

2. **Piso tipográfico:** los textos de menos de 12 px pasan a 0,75 rem. Los que se leen de un vistazo
   pasan a 0,8125 rem (13 px).

3. **Indicador no cromático:** un símbolo ✓ o ✗ antes del estado, con `::before` en CSS. Así no se
   toca el template, que también modifica PLAN-29.

La verificación es un escaneo con la fórmula de WCAG 2.1 que recorre todas las reglas con color de
texto. Se corre antes y después, y la salida queda en `06-verificacion-contraste.md`.

## Archivos a tocar

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/styles/_variables.scss` | modificar | Tokens `$color-text-muted`, `$color-status-ok` y `$color-status-alert` |
| `src/styles.scss` | modificar | Pills de estado a 13 px, con símbolo ✓/✗ |
| `src/app/pages/supervision/supervision.scss` | modificar | Badges a 13 px, textos a 12 px, grises y contador de excepciones |
| `src/app/pages/evidence-viewer/evidence-viewer.scss` | modificar | 9, 10 y 11 px a 12 y 13 px; colores de intacta y alterada; símbolo ✓/✗ |
| `src/app/pages/home/home.scss` | modificar | `opacity` sobre texto pasa a `$color-text-muted` |
| `src/app/pages/auditoria/auditoria.scss` | modificar | Encabezados y código de 11,5 px a 12 px |
| `src/app/pages/planificacion/planificacion.scss` | modificar | Encabezados, marca «Diferida», urgencia y enlace a 12 px o más |
| `src/app/forms/dynamic-form.component.ts` | modificar | Botón deshabilitado legible y gris de «Formulario sin campos» |
| `src/app/forms/fields/field-*.component.ts` (5) | modificar | Asterisco y error con `$color-error`; descripción con el gris nuevo |
| `src/app/pages/expediente/expediente.component.ts` | modificar | Grises de etiquetas y nota, y color del error |

Total: 14 archivos. Supera el límite de 12, así que el plan pasa por checkpoint.

Los estilos de los componentes con `styles` inline (formularios y expediente) no pueden importar
`_variables.scss`, así que usan el valor literal con un comentario que nombra el token. Moverlos a
archivos `.scss` es parte de PLAN-28.

## Decisiones técnicas

- **Un solo gris secundario (`#5b6778`) en lugar de una escala de varios.** Alcanza para todos los
  textos atenuados y deja margen (5,5:1 o más) sobre los fondos grises claros que usa la app. Se
  descartó reusar `#64748b` porque sobre `#f7fafc` da 4,54:1, apenas por encima del mínimo.
- **Símbolo con `::before` en lugar de cambiar el template.** Evita el conflicto con PLAN-29, que
  cambia las mismas líneas del template del visor. El contenido de `::before` lo leen los lectores de
  pantalla actuales.
- **Botón deshabilitado gris con texto oscuro, en vez de azul lavado con texto blanco.** El texto
  `#475569` sobre `#e2e8f0` da 6,15:1, así que se sigue leyendo, y el gris comunica «deshabilitado»
  mejor que un azul pálido.
- **No se tocan los colores que ya cumplen.** Así el diff queda chico y se deja la unificación a
  PLAN-28.

## Supuestos

- El fondo efectivo es blanco donde el CSS no declara otro, igual que en la auditoría (§8.1).
- PLAN-24 (Juan) cambia `:readonly` por `:read-only` en `field-text` y `field-number`. Son líneas
  vecinas a las que toca esta tarea, pero no las mismas: Git las puede combinar.
- PLAN-29 (en revisión) no toca estilos, salvo agregar el pipe en templates, así que no hay
  superposición.

## Cómo se prueba

1. Escaneo de contraste (`06-verificacion-contraste.md`): antes da 28 reglas bajo 4,5:1, y después
   no queda ninguna que incumpla su umbral, salvo los falsos positivos, que se justifican uno por uno.
2. Búsqueda de `font-size` por debajo de 0,75 rem, 12 px o 0,75 em: sin resultados.
3. Búsqueda de `opacity` sobre texto en `home.scss`: sin resultados.
4. `node .agents/scripts/verificar.mjs --tarea PLAN-25`: lint, tipos y tests.
