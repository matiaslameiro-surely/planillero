# PLAN-71 — Backoffice: la sesión se pierde si el backend no responde al recargar la página

## Contexto y problema

Detectado el 27/09 en la prueba de resiliencia del backoffice. Con el backend caído (o respondiendo
`5xx` a través de nginx), al recargar la página el backoffice intenta restaurar la sesión con
`POST /api/v1/auth/refresh`, recibe `502` y **borra el refresh token** de `localStorage`
(`planillero.refresh`). Cuando el backend vuelve, el supervisor tiene que iniciar sesión de nuevo.

Verificado en el código (27/09, `backoffice/src/app/core/services/auth.service.ts`):

- `ensureSession()` hace `clearSession()` ante **cualquier** error de `fetchUser()`.
- `refresh()` hace `clearSession()` ante **cualquier** error de `/auth/refresh`. Afecta también con
  la app abierta: si la renovación proactiva del interceptor coincide con una caída, la sesión se
  pierde igual.

El backend rechaza un refresh token inválido, vencido o revocado con `401 invalid_refresh_token`, y
un cuerpo mal formado con `400`. Esas son las únicas respuestas que significan «la sesión no sirve».

## Alcance

**Repos que toca:** `backoffice`

## Criterios de aceptación

1. Si `/auth/refresh` responde **4xx** (en la práctica `401` o `400`), la sesión se descarta como
   hoy: se borra el refresh token y se va al login.
2. Si `/auth/refresh` o `/auth/me` fallan por **error de red** (status `0`) o **5xx**, el refresh
   token **se conserva** en `localStorage`.
3. En ese caso, al recargar o entrar a una ruta protegida, el backoffice muestra una pantalla
   «Sin conexión con el servidor» con un botón **«Reintentar»**, en vez del login.
4. Al reintentar con el backend de vuelta, la sesión se restaura sin volver a iniciar sesión, y se
   llega a la ruta que se había pedido originalmente.
5. Con la app abierta, una renovación de token que falla por red o `5xx` **no** cierra la sesión:
   la petición falla y cada pantalla muestra su error como hoy.
6. Sin refresh token guardado, el comportamiento no cambia: se va al login.
7. Tests unitarios: `401` y `400` descartan la sesión; `502`, `503` y error de red la conservan, en
   `ensureSession()` y en `refresh()`. Test de las guardas con el nuevo estado.
8. Gates del backoffice en verde.

## Fuera de alcance

- El mensaje técnico del login cuando el backend no responde (`502`): es de PLAN-73.
- Reintentos automáticos en segundo plano o detección de «volvió la conexión»: alcanza con el botón.
- Mover el refresh token a una cookie `httpOnly` (limitación ya documentada en `TokenStoreService`).
- Cambios en el backend.

## Preguntas abiertas

- [x] `NO-BLOQUEANTE` — **¿Qué 4xx descartan la sesión?** Todos los 4xx de `/auth/refresh` y
  `/auth/me`: el backend sólo responde 4xx cuando la sesión o el pedido no son válidos, y reintentar
  no los arregla. Red y 5xx sí pueden arreglarse solos.
- [x] `NO-BLOQUEANTE` — **¿Dónde se muestra el aviso?** En una pantalla propia (ver plan), porque sin
  backend no se puede saber el usuario ni sus roles, y las pantallas protegidas no pueden cargar.
