# PLAN-81 — Móvil: corrección en envío de formulario dinámico, Safe Area y estilo de etiquetas

## Contexto y problema

Al utilizar la pantalla de carga de formularios dinámicos en la aplicación móvil (`frontend`):
1. **Envío bloqueado:** `FormularioScreen` (`src/app/formulario.tsx`) envuelve la llamada de guardado en el hook `useForm` y le pasa `handleSubmit` a `DynamicForm`. Como `DynamicForm` mantiene y envía sus propios valores mediante `onSubmit(values)`, pero el `handleSubmit` de `useForm` ignora los parámetros recibidos y valida su estado interno no enlazado (vacío `{}`), la validación de campos obligatorios falla silenciosamente y nunca se despacha la petición `submitForm` al backend.
2. **Corte y falta de visibilidad en extremos:** Al estar configurado `headerShown: false` a nivel global en Expo Router y carecer `FormularioScreen` de un contenedor con `SafeAreaView` o encabezado de navegación, el formulario se dibuja desde la coordenada superior `y=0` de la pantalla física. La etiqueta del primer campo queda oculta detrás del Notch / Barra de estado, y los elementos inferiores quedan pegados o solapados al pie.
3. **Color de etiquetas en rojo:** En los componentes de campos (`FieldText`, `FieldNumber`, `FieldSelect`, `FieldMultiSelect`, `FieldBoolean`), el estilo `styles.required` (`color: '#b91c1c'`) se aplica al contenedor de texto completo `{label}{required ? ' *' : ''}`, haciendo que todo el texto de la etiqueta sea rojo en lugar de mantener el color de texto estándar y resaltar exclusivamente el asterisco `*`.

## Alcance

**Repos que toca:** `frontend`

## Criterios de aceptación

1. En `frontend/src/app/formulario.tsx`, al presionar el botón de envío con el formulario completo y válido, se ejecuta la llamada a `submitForm` con el `visitId`, `templateKey`, `templateVersion` y el objeto `responses` con las respuestas capturadas, mostrando la alerta de confirmación y navegando atrás.
2. `FormularioScreen` está contenido en un `SafeAreaView edges={['top', 'bottom']}` e incluye barra superior con botón accesible para volver y título claro, garantizando que el primer campo y el último campo sean totalmente visibles y usables en dispositivos móviles.
3. Las etiquetas de los componentes de campo (`FieldText`, `FieldNumber`, `FieldSelect`, `FieldMultiSelect`, `FieldBoolean`) muestran su texto descriptivo en color tipográfico legible (`#0f172a`), y únicamente el carácter asterisco (`*`) de los campos obligatorios se muestra en rojo (`#b91c1c`).
4. Existen tests automatizados que verifican el correcto despacho de respuestas desde la pantalla de formulario y la estructura accesible de las etiquetas.

## Fuera de alcance

- Modificaciones en endpoints o validaciones del backend (`planillero-backend`).
- Modificaciones en la aplicación web `backoffice`.

## Preguntas abiertas

Ninguna.
