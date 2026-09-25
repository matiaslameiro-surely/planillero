# PLAN-56 — Móvil: mostrar u ocultar la contraseña en el Login

## Contexto y problema

En el Login de la app móvil (`frontend/src/app/login.tsx`) el campo de contraseña tiene
`secureTextEntry` fijo: no hay forma de ver lo que se escribió. Con contraseñas complejas y teclado
táctil, un error de tipeo sólo se descubre al fallar el login. Lo cargó Fernando en el Sprint 6.

Verificado en el código (25/09): el campo usa `secureTextEntry` sin condición. PLAN-55 (Juan), que
también tocaba `login.tsx`, ya está en `main`, así que no hay conflicto pendiente.

## Alcance

**Repos que toca:** `frontend`

## Criterios de aceptación

1. A la derecha del campo de contraseña hay un botón que alterna entre ocultarla y mostrarla. Arranca
   oculta.
2. El botón dice «Mostrar» cuando está oculta y «Ocultar» cuando se ve.
3. Accesibilidad: `accessibilityRole="button"` y `accessibilityLabel` «Mostrar contraseña» u «Ocultar
   contraseña», según el estado.
4. El área táctil del botón es de al menos `MIN_TOUCH_TARGET` (48 dp) de alto y de ancho.
5. Alternar no borra lo escrito ni cambia el resto del formulario: «Entrar», el Enter del teclado y
   el paso de 2FA funcionan igual.
6. Respeta el tema claro y oscuro (colores de `useThemeColors`, PLAN-48).
7. Tests del alternado, la accesibilidad y el área táctil, y gates del frontend en verde.

## Fuera de alcance

- Un ícono de ojo: la app no tiene una librería de íconos y no vale sumar una dependencia para un
  solo botón. El texto además es más claro para un lector de pantalla.
- Mostrar u ocultar el código de 2FA, que no es secreto a la vista.

## Preguntas abiertas

- [x] `NO-BLOQUEANTE` — **¿Texto o ícono?** Texto («Mostrar» / «Ocultar»): ver Fuera de alcance.
