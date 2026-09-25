# PLAN-55 — Móvil: envolver pantalla de Login en KeyboardAvoidingView / ScrollView para no tapar el botón Entrar

## Contexto y problema

La pantalla de login es la primera que ve el inspector y la única que no puede esquivarse: si falla, no hay
forma de seguir. En la prueba de campo del 25/09 (adjunto `teclado_tapa_boton_login.png`) se vio que al
tomar foco en usuario o contraseña, el teclado de Android cubre casi todo el botón «Entrar» y el área de
mensajes de error.

La causa está en el layout, no en el teclado. `src/app/login.tsx:73` monta la pantalla sobre un `View`
plano cuyo estilo es `flex: 1` con `justifyContent: 'center'` fijo (`login.tsx:166`). Ese contenedor no
scrollea y no reacciona al teclado, así que cuando la ventana se achica el contenido que no entra no tiene
por dónde ir.

El issue no es escueto: trae la causa, el archivo, la línea y tres criterios de aceptación explícitos. Es la
base de esta spec, no una fuente de supuestos.

Vale la pena registrar dos hechos del entorno que sostienen la solución y que no están en el issue:

- Android ya tiene `android:windowSoftInputMode="adjustResize"`. No es una decisión del proyecto: es el
  default de Expo, en `@expo/config-plugins/build/android/WindowSoftInputMode.js:40-43`, que devuelve
  `adjustResize` cuando `softwareKeyboardLayoutMode` no está declarado. `app.json` no lo declara. La
  ventana, entonces, ya se achica sola; lo que falta es poder llegar a lo que queda abajo.
- `KeyboardAvoidingView` no aparece en ningún archivo del repo, y `Platform.select` tampoco. Esta tarea
  introduce el primer patrón de manejo de teclado del proyecto, y por eso el criterio 1 del issue pide
  explícitamente «ajustado según la plataforma».

## Alcance

**Repos que toca:** `frontend`

Sin backend: no hay contrato de API que cambiar ni que emitir. `app.json` tampoco se toca, porque
`adjustResize` ya es lo que queremos (ver *Fuera de alcance*).

## Criterios de aceptación

1. La raíz de `src/app/login.tsx` es un `KeyboardAvoidingView` cuyo `behavior` es `'padding'` cuando
   `Platform.OS === 'ios'` y `undefined` cuando es Android.
2. Ese `KeyboardAvoidingView` envuelve un `ScrollView` con `keyboardShouldPersistTaps="handled"`, de modo
   que el primer toque sobre «Entrar» no se consuma en cerrar el teclado en lugar de disparar el login.
3. El `contentContainerStyle` del `ScrollView` declara `flexGrow: 1` junto con `justifyContent: 'center'`:
   con espacio de sobra el contenido queda centrado, y al achicarse la ventana el contenido se vuelve
   scrolleable desde su tope en lugar de quedar cortado.
4. Al fallar la autenticación, el teclado se cierra y el mensaje de error queda visible sin que haga falta
   desplazar.
5. Pasan los gates del repo: `npm run lint`, `npx tsc --noEmit` y `npm test`.
6. Hay un test que falla si alguien deshace el wrap de `KeyboardAvoidingView` + `ScrollView`, y otro que
   falla si el teclado deja de cerrarse al fallar el login.

## Fuera de alcance

- **`src/forms/DynamicForm.tsx` y `src/app/formulario.tsx`.** Tienen el mismo problema de clase:
  `ScrollView` con `TextInput` y ningún `KeyboardAvoidingView` (`DynamicForm.tsx:88`). El issue no los
  menciona y el usuario confirmó el alcance en `login.tsx` únicamente. Queda como tarea aparte.
- **`app.json` / `android.softwareKeyboardLayoutMode`.** Ya está en `adjustResize` y es lo correcto. Cambiarlo
  a `pan` sería empeorar las cosas: el sistema dejaría de achicar la ventana y el ajuste passaría a ser
  enteramente manual.
- **Insets de barra de estado en el login.** `login.tsx` no monta `DeviceStatusBar` ni aplica insets, así que
  el título «Planillero» puede quedar bajo la barra. Es otro problema, y PLAN-53 (SafeAreaView) cubre el
  caso análogo en otra pantalla. Que quede como tarea aparte.
- **`styles.buttonDisabled` (`login.tsx:197`).** Está muerto: el botón deshabilitado usa
  `colors.borderStrong` (`login.tsx:139`). Se lo va a borrar de paso porque se está tocando el mismo
  `StyleSheet`, pero no es parte del problema.

## Preguntas abiertas

Ninguna `BLOQUEANTE`. Las dos `NO-BLOQUEANTE` están resueltas y se dejan registradas para que la decisión
sea rastreable.

- [x] `NO-BLOQUEANTE` — **Cómo se verifica que el botón queda visible.** Los gates son determinísticos pero
  no calculan layout: ni `react-test-renderer` ni jest saben dónde cae el botón cuando el teclado se abre.
  El repo tampoco tiene un gate e2e ni una ruta de APK automatizada. Decidido: los criterios 1, 2, 3 y 6 se
  cubren con tests estructurales (fallan si se deshace el wrap) y el criterio 4 con `jest.spyOn` sobre
  `Keyboard.dismiss`. Lo que **no** queda cubierto es la prueba real en dispositivo: la tiene que hacer
  alguien con un emulador o tablet Android. Es el reporte quien tenía el equipo.
- [x] `NO-BLOQUEANTE` — **Si el error de autenticación debe dejarse scrolleable o cerrar el teclado.** El
  criterio 3 del issue dice que los mensajes «no queden ocultos», lo que admite dos lecturas: que se puedan
  desplazar hasta ellos, o que se vean directamente. Con scroll solo se cumple la primera. Decidido: cerrar
  el teclado con `Keyboard.dismiss()` al terminar cada envío, lo que cumple las dos y además mejora el paso
  al campo de código de 2FA. Aprobado por el usuario.
