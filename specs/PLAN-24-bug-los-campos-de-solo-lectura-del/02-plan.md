# Plan técnico — PLAN-24

## Enfoque

El bug es una línea por archivo, en dos componentes de campo del backoffice. El selector
`.field-input:readonly` es inválido en CSS (el pseudo-selector correcto es `:read-only`, con
guion) y el navegador descarta la regla completa al parsear. La corrección es reemplazar la
palabra clave en los dos componentes que la declaran: `field-text` y `field-number`. No hay
cambio de comportamiento lógico ni de datos: el atributo HTML `readonly` ya está bien emitido
(line 24 de cada componente), por lo que el problema es 100% visual y el fix lo activa.

## Archivos a tocar

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/forms/fields/field-text.component.ts` | modificar | Corregir `.field-input:readonly` → `.field-input:read-only` en el bloque `styles` |
| `src/app/forms/fields/field-number.component.ts` | modificar | Idéntico al anterior |

Total: 2 archivos, 1 línea cambiada por archivo. No supera `limiteArchivosSinCheckpoint`.

## Decisiones técnicas

- **Selector `:read-only` canónico, no binding de clase** — La alternativa era agregar una clase
  CSS condicional (`[class.readonly]`) manejada por el componente. Se descartó porque el
  pseudo-selector correcto ya expresa la intención original (la misma que escribió el autor del
  CSS), no requiere tocar el template y no introduce estado extra. Es el cambio mínimo que el issue
  pide y el revisor puede validar de un vistazo.
- **Fondo `#f7fafc` sin cambios** — Se descartó rediseñar el color o agrandar el contraste porque
  esa es la regla que el autor original escribió y nunca llegó a aplicarse; cambiar el valor caería
  en la superposición con PLAN-25 (WCAG AA) y PLAN-28 (tokens), ambos fuera de alcance de esta
  tarea (ver spec).

## Supuestos

- Que `:read-only` matchea en los navegadores soportados por Angular 22 (Chrome, Firefox, Safari,
  Edge) sobre un `<input readonly>`; es selector válido desde CSS3 UI y está soportado en todos los
  navegadores modernos, incluyendo los de la lista de soporte de Angular.
- Que el binding `[readonly]="readonly()"` en ambos componentes emite el atributo HTML `readonly`
  en el DOM (confirmado en `field-text.component.ts:24` y `field-number.component.ts:24`). Si esto
  no fuera así, la regla no tendría efecto, pero es una directiva Angular estándar.

## Contrato de API (sólo si el alcance es `ambos`)

No aplica: el alcance es `backoffice` únicamente y no se modifica ninguna API.

## Cómo se prueba

1. Gates automáticos del backoffice: `npm run lint` (0 warnings), `npm run build` (chequea tipos y
   templates), `npm test`.
2. Verificación visual del criterio 1: no hay un e2e con navegador en el repo, así que se valida con
   la compilación y una inspección del selector corregido; si el entorno local permite, puede
   confirmarse en el expediente con el stack levantado que el fondo de los campos readonly es
   `#f7fafc` (gris) y no blanco como los editables.