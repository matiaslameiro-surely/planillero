# Tareas — PLAN-55

## frontend *(app móvil)*

- [x] `[frontend]` Crear la rama `PLAN-55-movil-envolver-pantalla-de-login-en` desde `main`
- [x] `[frontend]` Raíz de `src/app/login.tsx`: `KeyboardAvoidingView` con `behavior` condicional
      (`'padding'` en iOS, `undefined` en Android) envolviendo un `ScrollView` con
      `keyboardShouldPersistTaps="handled"`
- [x] `[frontend]` Mover el centrado al `contentContainerStyle` con `flexGrow: 1` + `justifyContent: 'center'`,
      dejando `flex: 1` en el `ScrollView` y en el `KeyboardAvoidingView`
- [x] `[frontend]` `Keyboard.dismiss()` en el `finally` de `submitCredentials` y de `submitCode`
- [x] `[frontend]` Borrar `styles.buttonDisabled`, que quedó muerto
- [x] `[frontend]` Crear `src/app/login.test.tsx`: test estructural del wrap + test de `Keyboard.dismiss()`
      al fallar el login
- [x] `[frontend]` Commit `PLAN-55: evitar que el teclado tape el botón Entrar en el login` (`7ec72f6`)

## Verificación

- [x] Gates en verde (`node .agents/scripts/verificar.mjs --tarea PLAN-55`) — lint, `tsc` y 210 tests en 28 suites
- [x] Revisión independiente sin hallazgos `critical` ni `high` — `05-revision-frontend-1.json`, veredicto
      `approve`, 2 hallazgos `low`
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto
- [ ] Prueba manual en emulador Android (fuera del alcance de los gates: ver *Cómo se prueba* en
      `02-plan.md`) — **pendiente, la tiene que hacer alguien con el dispositivo**
