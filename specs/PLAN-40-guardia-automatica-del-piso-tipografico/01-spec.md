# PLAN-40 — Guardia automática del piso tipográfico y el contraste del backoffice

## Contexto y problema

PLAN-25 fijó en el backoffice un piso tipográfico de 12 px (0.75rem) y una escala de grises que cumple con los criterios de contraste WCAG AA. Sin embargo, tareas posteriores reintrodujeron tamaños tipográficos inferiores (p. ej. 9,3 px, 11 px) y atenuaciones con `opacity` sobre elementos con texto.

Esto ocurrió porque no existía un mecanismo automatizado que impidiera introducir reglas de estilo que violen estas restricciones de accesibilidad y diseño.

Esta tarea implementa una guardia automatizada (suite de pruebas / gate) que analiza todas las hojas de estilo (`.scss`) y estilos embebidos (`.ts`) dentro de `src/` del backoffice, fallando de manera clara y determinística cuando se infrinja el piso tipográfico o se utilice `opacity` indebidamente.

## Alcance

**Repos que toca:** `backoffice`

## Criterios de aceptación

1. **Guardia tipográfica automática:** El gate (suite de pruebas ejecutada en `npm test` / `verificar.mjs`) escanea todos los archivos `.scss` y estilos embebidos en `.ts` dentro de `src/` del backoffice y falla ante cualquier `font-size` con un valor inferior a `$font-size-min` (12 px / 0.75rem / 9pt / 0.75em).
2. **Control de `opacity` con excepciones explícitas:** El gate falla ante el uso de `opacity` en reglas de estilo, a menos que esté documentada una excepción explícita justificada (por ejemplo mediante una anotación/comentario `allow-opacity: <motivo>`).
3. **Paso en `main` actual:** Con el código actual de `main` en `backoffice`, el gate pasa exitosamente sin falsos positivos.
4. **Mensajes de error descriptivos y accionables:** Cuando el gate detecta una infracción, el mensaje de error indica con precisión el archivo, número de línea, valor detectado y el piso esperado (`$font-size-min`), permitiendo solucionar el problema de inmediato sin requerir contexto adicional.

## Fuera de alcance

- Verificación automatizada de contraste fondo/texto (queda para una segunda etapa, como indica el issue, debido a la complejidad de auditar fondos dinámicos y tamaños relativos en tiempo estático).
- Modificaciones en `backend` o `frontend`.

## Preguntas abiertas

Ninguna.
