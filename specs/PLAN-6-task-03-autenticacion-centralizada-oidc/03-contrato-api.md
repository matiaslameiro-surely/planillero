# Contrato de API — PLAN-6 (autenticación y RBAC)

Lo que consumen `frontend` (app móvil) y `backoffice` (web). Lo emite el backend.

## General

- **Base URL (dev):** `http://localhost:8080`
- **Formato:** JSON (`Content-Type: application/json`), salvo el `NO_CONTENT` sin cuerpo.
- **Autenticación:** `Authorization: Bearer <accessToken>`.
- **Errores:** siempre `{ "error": "<codigo>", "message": "<texto en español>" }`.
- **Códigos:** `400` pedido inválido · `401` sin token / token o credenciales inválidas · `403` rol
  insuficiente · `409` el recurso ya está en el estado pedido · `429` demasiados intentos de login o
  de código de 2FA.

## Flujo

1. `POST /api/v1/auth/login` con usuario y contraseña.
   - Si el usuario **no** tiene 2FA: responde tokens y termina.
   - Si lo tiene: responde `twoFactorRequired` + `challengeId` y hay que ir al paso 2.
2. `POST /api/v1/auth/verify-2fa` con el `challengeId` y el código TOTP de 6 dígitos → tokens. El desafío se
   canjea **una sola vez** y los intentos fallidos se cuentan: superado el umbral (5 por defecto en
   15 minutos) responde `429`.
3. Las llamadas autenticadas llevan `Authorization: Bearer <accessToken>`.
4. Cuando el access token expira (401), `POST /api/v1/auth/refresh` con el `refreshToken` → par nuevo. El
   refresh viejo queda revocado (rotación): hay que guardar el nuevo.
5. `POST /api/v1/auth/logout` con el `refreshToken` revoca la sesión.

## Endpoints

### `POST /api/v1/auth/login`

Público.

Request:
```json
{ "username": "operador.demo", "password": "Operador123!" }
```

Response `200` (login completo):
```json
{ "twoFactorRequired": false, "accessToken": "<jwt>", "refreshToken": "<opaco>" }
```

Response `200` (falta 2FA):
```json
{ "twoFactorRequired": true, "challengeId": "<jwt breve>" }
```

Response `401`:
```json
{ "error": "invalid_credentials", "message": "Usuario o contraseña incorrectos." }
```

Response `429` (fuerza bruta):
```json
{ "error": "too_many_attempts", "message": "Demasiados intentos fallidos. Probá de nuevo más tarde." }
```

### `POST /api/v1/auth/verify-2fa`

Público. Request:
```json
{ "challengeId": "<el que devolvió el login>", "code": "123456" }
```

Response `200`:
```json
{ "accessToken": "<jwt>", "refreshToken": "<opaco>" }
```

Response `401`: `{ "error": "invalid_two_factor_code" | "invalid_challenge", "message": "..." }`
(`invalid_challenge` también cuando el desafío **ya fue usado**: no se puede canjear dos veces).

Response `429` (fuerza bruta sobre el código):
```json
{ "error": "too_many_attempts", "message": "Demasiados intentos fallidos. Probá de nuevo más tarde." }
```

### `POST /api/v1/auth/refresh`

Público. Request:
```json
{ "refreshToken": "<opaco>" }
```

Response `200`: `{ "accessToken": "<jwt>", "refreshToken": "<nuevo>" }`

Response `401`: `{ "error": "invalid_refresh_token", "message": "..." }` (revocado, expirado o ya usado)

### `POST /api/v1/auth/logout`

Público. Request: `{ "refreshToken": "<opaco>" }` → `204`. Idempotente.

### `GET /api/v1/auth/me`

Requiere Bearer. Response `200`:
```json
{ "username": "admin.demo", "roles": ["ADMINISTRATOR"], "twoFactorEnabled": false }
```

### Segundo factor (TOTP)

Todos requieren Bearer.

- `POST /api/v1/auth/2fa/setup` → `200`:
  ```json
  { "secret": "<base32>", "otpauthUri": "otpauth://totp/Planillero:admin.demo?secret=...&issuer=Planillero..." }
  ```
  El secreto queda **pendiente**: todavía no exige código en el login. Si el 2FA **ya está
  habilitado** responde `409` y no genera un secreto nuevo (hay que deshabilitarlo antes):
  ```json
  { "error": "two_factor_already_enabled", "message": "El segundo factor ya está habilitado..." }
  ```
- `POST /api/v1/auth/2fa/enable` con `{ "code": "123456" }` → `204`. Recién acá el login pide el código.
- `POST /api/v1/auth/2fa/disable` con `{ "code": "123456" }` → `204`. Idempotente si ya estaba apagado.

### Endpoints de ejemplo por rol

- `GET /api/v1/roles/ejemplo-operador` — Bearer con rol `OPERATOR`, `SUPERVISOR` o `ADMINISTRATOR` → `200`.
- `GET /api/v1/roles/ejemplo-admin` — Bearer con rol `ADMINISTRATOR` → `200`; otro rol → `403`

  ```json
  { "error": "forbidden", "message": "El usuario no tiene permisos para este recurso." }
  ```

### `GET /salud`

Público. `200 { "estado": "ok", "momento": "<ISO-8601>" }`.

## Access token (JWT)

Firmado con **RS256**. Claims:

| Claim | Valor |
|---|---|
| `iss` | `planillero-backend` (configurable) |
| `sub` | nombre de usuario |
| `iat` / `exp` | emisión / expiración (15 min por defecto) |
| `roles` | lista de roles, p. ej. `["OPERATOR"]`, `["SUPERVISOR"]`, `["ADMINISTRATOR"]` |
| `purpose` | `access` (los desafíos de 2FA usan `two_factor` y no sirven como access) |

Los roles válidos son `OPERATOR`, `SUPERVISOR` y `ADMINISTRATOR`.

## Credenciales de seed (FICTICIAS, solo desarrollo)

| Usuario | Contraseña | Rol |
|---|---|---|
| `operador.demo` | `Operador123!` | `OPERATOR` |
| `supervisor.demo` | `Supervisor123!` | `SUPERVISOR` |
| `admin.demo` | `Admin123!` | `ADMINISTRATOR` |

No son personas reales: son usuarios inventados para probar el flujo.
