# Plan técnico — PLAN-71

## Enfoque

Distinguir dos tipos de falla al restaurar o renovar la sesión:

- **La sesión fue rechazada** (el backend respondió 4xx): se descarta como hoy.
- **El servidor no está disponible** (error de red, status `0`, o 5xx): se conserva el refresh token y
  la sesión pasa a un estado nuevo, `unreachable`.

Las guardas, cuando no hay usuario y el estado es `unreachable`, mandan a una pantalla nueva
`/sin-conexion?volver=<url pedida>` en lugar del login. Esa pantalla tiene un botón «Reintentar» que
vuelve a llamar a `ensureSession()`. Si hay usuario, navega a `volver`; si la sesión fue rechazada, va
al login; si el servidor sigue sin responder, lo dice y deja reintentar.

Con la app abierta, `refresh()` deja de limpiar la sesión ante red o 5xx: el error se propaga a la
petición y cada pantalla lo muestra como hoy.

## Archivos a tocar

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/core/services/auth.service.ts` | modificar | Estado `unreachable`; `ensureSession()` y `refresh()` limpian sólo ante 4xx |
| `src/app/core/guards/session-redirect.ts` | crear | Helper común: `UrlTree` al login o a `/sin-conexion?volver=…` según el estado |
| `src/app/core/guards/authenticated.guard.ts` | modificar | Usar el helper |
| `src/app/core/guards/supervisor.guard.ts` | modificar | Usar el helper |
| `src/app/core/guards/administrator.guard.ts` | modificar | Usar el helper |
| `src/app/core/guards/anonymous.guard.ts` | modificar | Con `unreachable`, ir a `/sin-conexion` (hay sesión guardada; el login no serviría) |
| `src/app/pages/server-unavailable/server-unavailable.{ts,html,scss}` | crear | Pantalla «Sin conexión con el servidor» con «Reintentar» |
| `src/app/app.routes.ts` | modificar | Ruta `sin-conexion`, sin guarda |
| `src/app/core/services/__tests__/auth.service.spec.ts` | modificar | 401/400 descartan; 502/503/red conservan (`ensureSession` y `refresh`) |
| `src/app/core/guards/__tests__/session-redirect.spec.ts` | crear | Guardas con `unreachable` → `/sin-conexion` con `volver` |
| `src/app/pages/server-unavailable/__tests__/server-unavailable.spec.ts` | crear | Reintento: éxito → `volver`; rechazo → login; sigue caído → mensaje |

Total: 11 archivos más la hoja de estilos de la pantalla.

## Decisiones técnicas

- **Pantalla propia `/sin-conexion` en vez de un banner.** Sin backend no se conoce el usuario ni sus
  roles, así que la guarda no puede decidir si deja pasar. Se descartó dejar pasar a la ruta con un
  banner porque las pantallas protegidas cargarían vacías o con errores. También se descartó quedarse
  en el login con un aviso: confunde, porque el usuario *tiene* sesión y no debería volver a escribir
  la contraseña.
- **4xx descarta, red y 5xx conservan.** Se descartó limitarlo a `401`/`400` exactos: cualquier 4xx de
  `/auth/refresh` o `/auth/me` significa que reintentar no lo arregla, mientras que red y 5xx sí.
- **El estado vive en `AuthService.status`** (se suma `unreachable` a `SessionStatus`) y las guardas lo
  leen cuando `ensureSession()` devuelve `null`. Se descartó cambiar el tipo de retorno de
  `ensureSession()`: lo usan cuatro guardas y sus tests, y el cambio sería más invasivo sin ganar nada.
- **`volver` se valida**: sólo rutas internas (empiezan con `/`, no con `//`, y no son
  `/sin-conexion`). Si no es válida se usa `/`. Evita una redirección abierta a otro sitio.
- **Reintento manual, sin polling.** Fuera de alcance según la spec; el botón alcanza.

## Supuestos

- El backend responde `401 invalid_refresh_token` ante un refresh token inválido, vencido o revocado
  (`RefreshTokenService`, `AuthService.refresh`), y nginx devuelve `502` cuando el backend no responde.
  Verificado en el código y en la prueba del 27/09.
- Un `/auth/refresh` que llegó al backend pero cuya respuesta se perdió (el backend rotó el token) deja
  el token guardado revocado. Al reintentar, el backend responde `401` y se va al login. Es aceptable:
  no hay forma de recuperarlo del lado del cliente.
- No hay supuestos `RIESGO`.
