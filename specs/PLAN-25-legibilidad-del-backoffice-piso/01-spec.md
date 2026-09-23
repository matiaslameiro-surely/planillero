# PLAN-25 — Legibilidad del backoffice: piso tipográfico de 12 px y escala de grises que cumpla WCAG AA

## Contexto y problema

La auditoría UX/UI de PLAN-18 (hallazgos H28 a H32, `docs/auditoria-ux-ui.md` §8) midió 59 pares
texto/fondo: 15 incumplen WCAG AA, 21 textos quedan por debajo de 12 px y el más chico es de 9 px.

PLAN-23 (ya mergeado) corrigió el color primario, así que de los 15 pares quedan 13. Un escaneo propio
del código actual, con la fórmula de WCAG 2.1 sobre cada regla que declara un color de texto, confirma
esos 13 y agrega casos que la auditoría no listaba: los asteriscos de campo obligatorio en los cinco
componentes de formulario, el mensaje de error del expediente y el contador de excepciones.

Lo más grave:
- **H28:** los badges de estado de Supervisión, que el supervisor lee de reojo, van a 10,4 px. El
  visor de evidencias llega a 9 px.
- **H29:** los estados periciales «intacta» y «alterada» son los que peor se leen (3,30:1 y 3,76:1),
  y se distinguen **sólo por el color**.
- **H30:** el botón «Enviar» deshabilitado da 1,82:1.
- **H31:** hay grises de dos escalas ajenas: `#94a3b8` (2,56:1) y `#718096` (4,02:1).
- **H32:** en el home se atenúa el texto con `opacity`, que produce contrastes que nadie calculó.

## Alcance

**Repos que toca:** `backoffice`

## Criterios de aceptación

1. Ningún texto de la interfaz queda por debajo de 12 px (0,75 rem). Lo que se lee de un vistazo
   (badges de estado, estados periciales, tipo de evidencia, contador de excepciones) va a 13 px como
   mínimo.
2. Todos los pares texto/fondo alcanzan el umbral AA que les corresponde según la fórmula de WCAG 2.1:
   4,5:1 para texto normal y 3:1 para texto grande (≥ 24 px, o ≥ 18,66 px en negrita). Queda
   verificado con un escaneo del código antes y después, guardado en la spec.
3. Los estados «intacta» y «alterada», tanto en la tabla de verificación como en el estado del
   manifiesto, se distinguen por un símbolo además del color.
4. La atenuación con `opacity` sobre texto se reemplaza por colores explícitos de la paleta.
5. Los grises nuevos y los colores de estado salen de `_variables.scss`, con su contraste anotado en
   un comentario.
6. Los gates del backoffice quedan en verde.

## Fuera de alcance

- Unificar todos los tokens de diseño y exponerlos como variables CSS: es PLAN-28 (Juan). Esta tarea
  sólo agrega a `_variables.scss` los tokens que necesita, y en PLAN-28 se van a migrar.
- Colores que ya cumplen: no se tocan para no ampliar el diff ni pisar a PLAN-28.
- Los colores de los KPI de Supervisión: son texto grande (1,3 rem en negrita) y el menor da 3,19:1,
  por encima del 3:1 que corresponde.

## Preguntas abiertas

Ninguna.
