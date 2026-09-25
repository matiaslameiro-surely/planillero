# Plan técnico — PLAN-55

## Enfoque

La causa del bug es una sola línea de estilo: `justifyContent: 'center'` sobre un contenedor que no scrollea
(`login.tsx:166`). Todo lo demás se sigue de ahí.

La solución es darle a la pantalla una raíz que sepa que hay teclado y un contenedor que pueda desplazarse.
`KeyboardAvoidingView` como raíz, `ScrollView` adentro. Pero el detalle que decide si esto funciona o no está
en el `contentContainerStyle`, no en el `KeyboardAvoidingView`:

> Mover `justifyContent: 'center'` al `contentContainerStyle` **y** agregarle `flexGrow: 1`.

Sin `flexGrow: 1`, el contenedor de contenido mide lo que miden sus hijos: si el teclado achica la ventana
por debajo de esa altura, `center` centra sobre la altura del contenido y el tope se sale de la pantalla
por arriba, sin scroll que lo alcance. El `flexGrow: 1` hace que el contenedor mida `max(contenido,
viewport)`: con espacio de sobra centra, y sin espacio el centro no tiene efecto, el contenido arranca
arriba y se scrollea completo. Un `flexGrow: 1` sin el `center` tampoco sirve, porque perdemos el centrado
que la pantalla tiene hoy en una tablet sin teclado abierto.

El segundo detalle es de plataforma. Android ya achica la ventana por `adjustResize` (default de Expo, no
decisión del proyecto — ver `01-spec.md`), así que ahí el `KeyboardAvoidingView` no debe sumar padding: lo
haría en doble. En iOS no hay `adjustResize` y sí hace falta. De ahí el `behavior` condicional.

El tercero es el que hace cumplir el criterio 3 del issue: cerrar el teclado al terminar cada envío. Va en
el `finally`, no en el `catch`, porque el mismo problema aparece cuando el login tiene éxito y la pantalla
pasa al campo de código de 2FA, que hereda el foco de un campo de contraseña que ya no existe.

## Archivos a tocar

### backend/

Ninguno. El alcance es `frontend`.

### frontend/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/login.tsx` | modificar | Raíz `KeyboardAvoidingView` + `ScrollView`, `contentContainerStyle` con `flexGrow: 1`, `Keyboard.dismiss()` en ambos submits, y se borra `styles.buttonDisabled` que quedó muerto |
| `src/app/login.test.tsx` | crear | Test estructural del wrap y test de `Keyboard.dismiss()` al fallar el login |

**Total: 2 archivos.** Muy por debajo de `limiteArchivosSinCheckpoint: 12`.

No hace falta tocar `app.json`, ni `package.json`, ni instalar nada: `KeyboardAvoidingView`, `ScrollView`,
`Keyboard` y `Platform` son todos de `react-native`, que ya está.

## Decisiones técnicas

- **`behavior` condicional por plataforma en vez de `padding` en todas.** Se descartó `padding` en ambas
  porque en Android el `adjustResize` nativo ya achica la ventana y el `padding` sumaría un segundo
  desplazamiento: el formulario quedaría separados del teclado y habría que scrollear de más para
  reencontrarlo. `KeyboardAvoidingView` en Android sin `behavior` es exactamente un `View`.

- **`Keyboard.dismiss()` en el `finally` y no en el `catch`.** Se descartó ponerlo sólo en el `catch` —que
  es lo obvio para el criterio 3— porque deja el caso del 2FA: al pasar de `credentials` a `twoFactor` el
  `TextInput` de contraseña se desmonta con el foco puesto, y el teclado queda flotando sobre la pantalla
  nueva tapando el campo de código. En el `finally` un solo call-site cubre error, 2FA y redirect.

- **`contentContainerStyle` con `flexGrow: 1` en vez de `flex: 1`.** Se descartó `flex: 1` porque obliga al
  contenido a la altura exacta del viewport: deja de scrollear en el momento exacto en que hace falta
  scrollear, que es el bug que estamos arreglando.

- **Test en `src/app/login.test.tsx` colocalado, y no en `src/components/__tests__/`.** El repo tiene las
  dos convenciones. Los archivos de `__tests__/` (`ergonomics.test.tsx`, `themeContrast.test.tsx`) son
  cortes temáticos que cruzan varios componentes; un test que cubre una sola pantalla va colocalado, como
  `src/components/VisitCard.test.tsx` y `src/components/DeviceStatusBar.test.tsx`.

- **`jest.spyOn(Keyboard, 'dismiss')` y no `jest.mock('react-native', …)`.** El repo ya tiene el motivo
  anotado en `src/sync/signOutGuard.test.ts:5-6`: mockear el módulo `react-native` entero rompe el preset de
  `jest-expo`, que necesita el `Platform` real para arrancar. Espiar una propiedad del objeto `Keyboard` no
  reemplaza el módulo, así que esquiva el problema.

- **Sin `keyboardDismissMode`.** Se descartó: no lo pide ningún criterio de aceptación y suma una decisión
  de comportamiento (deslizar para cerrar el teclado) que nadie pidió. Si aparece en la revisión, se
  agrega; no se anticipa.

## Supuestos

- `NO-RIESGO` — Que el reporte es de Android y que `adjustResize` es el modo vigente. Confirmado leyendo
  `@expo/config-plugins/build/android/WindowSoftInputMode.js:40-43`: sin `softwareKeyboardLayoutMode`
  declarado devuelve `adjustResize`, y `app.json` no lo declara.

- `NO-RIESGO` — Que `KeyboardAvoidingView` con `behavior` indefinido sobre Android es inocuo. Es
  literalmente un `View` cuando no hay `behavior`: el componente no registra layout y no calcula offset.

- `NO-RIESGO` — Que el `ScrollView` con `contentContainerStyle` en `flexGrow` se comporta como se espera
  (centra con espacio, scrollea sin él). Es el patrón canónico de React Native y el criterio 3 de la spec
  es exactamente esa propiedad, pero **no está verificado en este repo**: ningún test puede calcular layout.
  Queda como la prueba pendiente del apartado siguiente.

- `NO-RIESGO` — Que `react-test-renderer` puede renderizar `login.tsx` con los mismos mocks que ya usa
  `src/components/__tests__/themeContrast.test.tsx:14-25`, que mockea `expo-router` y
  `@/auth/SessionContext`. Esa prueba ya renderiza `@/app/index`, o sea que el camino está hecho. La única
  diferencia es que `login` además usa `Keyboard`, que es parte del mismo módulo.

- `RIESGO` — Que cerrar el teclado en el `finally` no incomode el flujo normal de 2FA. Si al pasar al paso
  de código el teclado se cierra y hay que tocar el campo otra vez para escribir el código, se agregó un
  gesto. No es verificable sin dispositivo. Mitigación: si en la prueba de campo molesta, se saca la llamada
  del camino de éxito y se deja sólo en el `catch`, que es donde el criterio 3 la exige.

## Cómo se prueba

Automático, por los gates del repo (`node .agents/scripts/verificar.mjs --tarea PLAN-55`):

- `npm run lint` y `npx tsc --noEmit` sobre el resultado.
- `npm test`: los 27 suites existentes, más los 2 casos nuevos. El test estructural falla si alguien saca el
  `KeyboardAvoidingView` o el `ScrollView`, o si cambia `keyboardShouldPersistTaps` o `flexGrow`. El de
  `Keyboard.dismiss()` falla si el teclado deja de cerrarse al rechazar el login.

**Lo que ninguna de las dos capas prueba:** que el botón «Entrar» quede visible con el teclado abierto. Es un
problema de layout, y ni `react-test-renderer` ni jest calculan posiciones. El repo no tiene gate e2e ni una
ruta automatizada de APK.

Manual, y es la que decide si el bug está realmente cerrado:

1. Abrir la app en un emulador o tablet Android, entrar a `/login`.
2. Tocar «Contraseña» y confirmar que «Entrar» queda visible o alcanzable con un dedo.
3. Escribir credenciales incorrectas y confirmar que el mensaje de error aparece sin taparlo nada.
4. Credenciales válidas de una cuenta con 2FA: confirmar que el paso de código no queda tapado por un teclado
   heredado del campo de contraseña.
