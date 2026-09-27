# Plan técnico — PLAN-81

## Enfoque

Resolveremos los tres problemas identificados en `frontend` de forma desacoplada y directa:
1. **Despacho del formulario:** En `src/app/formulario.tsx`, eliminamos el uso redundante del hook `useForm` (cuyo estado desconectado bloqueaba el envío). Pasamos la función asíncrona `handleSubmit(values)` directamente como prop `onSubmit` de `DynamicForm`, administrando el estado de envío (`submitting`) para evitar envíos concurrentes y feedback visual en el botón.
2. **Safe Area y Header:** Envolvemos `FormularioScreen` en `SafeAreaView edges={['top', 'bottom']}` de `react-native-safe-area-context` y añadimos una barra superior accesible con botón "← Volver" y título "Formulario", garantizando que tanto el primer campo como el último campo y el botón de envío sean completamente visibles sin cortes por la barra de estado o notch.
3. **Color de etiquetas:** En los 5 componentes de campo (`FieldText`, `FieldNumber`, `FieldSelect`, `FieldMultiSelect`, `FieldBoolean`), separamos la etiqueta de texto del asterisco de obligatoriedad: el texto principal conserva su estilo de etiqueta normal (`#0f172a`), mientras que el indicador `*` se estiliza con `requiredAsterisk` (`color: '#b91c1c'`).

## Archivos a tocar

### frontend/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/formulario.tsx` | modificar | Envolver en `SafeAreaView`, agregar barra superior accesible con botón de volver y conectar `DynamicForm.onSubmit` directo con `submitForm`. |
| `src/forms/fields/FieldText.tsx` | modificar | Separar el estilo de texto de la etiqueta del asterisco obligatorio en rojo. |
| `src/forms/fields/FieldNumber.tsx` | modificar | Separar el estilo de texto de la etiqueta del asterisco obligatorio en rojo. |
| `src/forms/fields/FieldSelect.tsx` | modificar | Separar el estilo de texto de la etiqueta del asterisco obligatorio en rojo. |
| `src/forms/fields/FieldMultiSelect.tsx` | modificar | Separar el estilo de texto de la etiqueta del asterisco obligatorio en rojo. |
| `src/forms/fields/FieldBoolean.tsx` | modificar | Separar el estilo de texto de la etiqueta del asterisco obligatorio en rojo. |
| `src/__tests__/app/formulario.test.tsx` | crear | Test unitario de `FormularioScreen` para verificar renderizado con safe area, carga de plantilla y envío exitoso con `submitForm`. |

## Decisiones técnicas

- **Eliminación directa de `useForm` en `formulario.tsx`** — Se descartó adaptar `useForm` para que reciba valores externos porque `DynamicForm` ya es un componente auto-contenido con validación completa por schema y estados propios de campos y errores.
- **Uso de `SafeAreaView` con `edges={['top', 'bottom']}`** — Se descartó aplicar simples `paddingTop` fijos porque varían entre dispositivos y plataformas (iOS con Dynamic Island vs Android).

## Supuestos

- `submitForm` en `src/api/visits.ts` ya espera el formato `{ templateKey, templateVersion, responses }`, coincidente con lo que el backend `POST /api/v1/visitas/{id}/formulario` procesa.

## Cómo se prueba

1. Ejecutar `npm test` en `frontend/` para correr los tests existentes y los nuevos de `formulario.test.tsx`.
2. Ejecutar `npm run lint` y `npx tsc --noEmit` para validar tipos y estilo de código.
3. Ejecutar los gates con `node .agents/scripts/verificar.mjs --tarea PLAN-81`.
