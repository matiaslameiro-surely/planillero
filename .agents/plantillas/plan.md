# Plan técnico — <CLAVE>

> Plantilla de la fase 2. Borrá estas citas al completarla.
> Antes de escribir nada, **explorá el código**: lo que ya existe y se puede reusar vale más
> que cualquier propuesta nueva.

## Enfoque

> En prosa breve: cómo se resuelve. Si hay una decisión de diseño que ordena todo lo demás,
> va acá y no escondida en la lista de archivos.

## Archivos a tocar

### backend/

| Archivo | Acción | Para qué |
|---|---|---|
| | crear / modificar | |

### frontend/

| Archivo | Acción | Para qué |
|---|---|---|
| | crear / modificar | |

> El total de archivos importa: si supera el límite de `workspace.json`, el flujo frena para
> que lo apruebes antes de escribir código.

## Decisiones técnicas

> Una por decisión, con la alternativa que descartaste y por qué. Sin la alternativa,
> no es una decisión: es una preferencia sin justificar.

- **\<decisión\>** — Se descartó \<alternativa\> porque \<motivo\>.

## Contrato de API (sólo si el alcance es `ambos`)

> A alto nivel: endpoints, verbos y forma de los datos. El detalle definitivo lo emite el
> backend en la fase 3, en `03-contrato-api.md`, y es lo que consume el frontend.

| Método | Ruta | Request | Response |
|---|---|---|---|
| | | | |

## Supuestos

> **Sección obligatoria.** Todo lo que estás dando por cierto sin haberlo confirmado.
> Marcá `RIESGO` los que, si están mal, invalidan el plan entero — cualquiera de esos
> fuerza un checkpoint aunque la configuración no lo pida.
>
> Si no hay ninguno, escribí «Ninguno». Una lista vacía es una afirmación, no un olvido.

- `RIESGO`
-

## Cómo se prueba

> Qué se corre para saber que esto anda, más allá de los gates automáticos.
> Si un criterio de aceptación no se puede probar con nada de lo que está acá, falta algo.
