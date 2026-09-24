# PLAN-24 — Bug: los campos de sólo lectura del expediente se ven idénticos a los editables

## Contexto y problema

Detectado por la auditoría UX/UI de PLAN-18 (hallazgo H14). No es cosmético: es una regla de
estilo que el navegador descarta al parsear, así que nunca se aplicó desde que se escribió.

Dos componentes de campo declaran el mismo selector inválido:

- `src/app/forms/fields/field-text.component.ts:46`
- `src/app/forms/fields/field-number.component.ts:48`

Ambos tienen:

```css
.field-input:readonly { background: #f7fafc; }
```

`:readonly` no existe en CSS. El pseudo-selector definido por la especificación es `:read-only`
(con guion). Al ser inválido, el navegador descarta la regla completa al parsear y el fondo gris
que debía distinguir los campos de sólo lectura nunca se aplica.

El impacto visible: el expediente digital renderiza el formulario de la visita en modo `readonly`
(`src/app/pages/expediente/expediente.component.ts:51`), por lo que sus campos se ven idénticos a
los editables y el usuario descubre que no puede escribir recién cuando lo intenta. El atributo
HTML `readonly` sí está bien puesto en ambos componentes (línea 24 de cada uno), así que el dato
está protegido: **lo que falla es exclusivamente el aviso visual**.

## Alcance

**Repos que toca:** `backoffice` (Angular).

## Criterios de aceptación

1. En el expediente, los campos en modo sólo lectura se distinguen visualmente de los editables:
   el fondo gris `#f7fafc` que declara la regla se aplica efectivamente a los `input` con el
   atributo `readonly`.
2. La corrección cubre los dos componentes que declaran la regla: `field-text` y `field-number`.
3. Los gates del backoffice quedan en verde (lint, build/tipos, tests).

## Fuera de alcance

- Los componentes `field-select`, `field-multiselect` y `field-boolean`: en modo readonly usan
  `disabled` (no `readonly`) y no declaran la regla defectuosa; su look también es diferente ya.
- La migración a tokens de diseño / custom properties CSS: es la tarea PLAN-28 (misma fuente H6/H7
  de PLAN-18 pero separada).
- Ajustes de contraste y piso tipográfico por WCAG AA: es PLAN-25. Acá sólo se activa la regla que
  el autor original escribió (`#f7fafc`), sin rediseñar.
- Los esqueletos/archivos con nombres en español: no pasan por renombrado en esta tarea.

## Preguntas abiertas

Ninguna.