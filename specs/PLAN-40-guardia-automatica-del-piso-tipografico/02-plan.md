# Plan técnico — PLAN-40

## Enfoque

Implementar una suite de pruebas automatizadas en `backoffice` (`src/app/styles/__tests__/typography-guard.spec.ts`) que se ejecuta como parte de `npm test` (Vitest) y del gate de verificación (`node .agents/scripts/verificar.mjs`).

El verificador escanea estáticamente todos los archivos `.scss` y los estilos embebidos en archivos `.ts` dentro de `src/`, asegurando que:
1. No existan declaraciones de `font-size` con tamaños inferiores a `$font-size-min` (12px / 0.75rem / 9pt / 0.75em).
2. No se use `opacity` sin una excepción explícita comentada (`/* allow-opacity: <motivo> */` o `// allow-opacity: <motivo>`).
3. Los mensajes de fallo reporten con precisión el archivo, número de línea, valor encontrado y la regla infringida para facilitar la corrección inmediata.

## Archivos a tocar

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/styles/__tests__/typography-guard.spec.ts` | crear | Test automatizado que audita archivos `.scss` y `.ts` (estilos embebidos) en `src/`, validando piso tipográfico y uso controlado de `opacity`. Incluye pruebas sobre el propio analizador. |
| `src/app/core/components/navbar/navbar.scss` | modificar | Anotar la excepción justificada `/* allow-opacity: hover transition on brand logo */` en el logo de la barra de navegación. |
| `src/app/forms/fields/field-boolean.component.ts` | modificar | Anotar la excepción justificada `/* allow-opacity: hidden checkbox input for switch */` en el input del switch accesible. |

## Decisiones técnicas

- **Implementación como test de Vitest (`ng test`)** — Se descartó un plugin personalizado de Stylelint o regla compleja de ESLint porque Vitest ya corre como parte del gate obligatorio `npm test` en `workspace.json`, se ejecuta en <100ms, no añade dependencias pesadas ni rompe la configuración de build existente de Angular 22.
- **Mecanismo de excepción vía comentarios `allow-opacity: <motivo>`** — Se descartó una lista blanca hardcodeada de rutas en el script porque colocar la justificación junto a la línea de código obliga a quien programa a documentar el motivo del uso de `opacity` en el propio componente.

## Supuestos

- `Ninguno`

## Cómo se prueba

1. Ejecutar `npm test` en `backoffice` y verificar que todos los tests pasen (incluyendo el nuevo `typography-guard.spec.ts`).
2. Ejecutar `node .agents/scripts/verificar.mjs --tarea PLAN-40` para validar que el gate completo del harness pase.
3. Validar con pruebas unitarias específicas dentro del spec que fragmentos de código con `font-size: 11px`, `font-size: 0.7rem`, `font-size: 9.3px` u `opacity` sin justificar sean detectados y generen el error descriptivo correspondiente.
