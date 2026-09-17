# PLAN-6 — TASK-03: Autenticación Centralizada (OIDC/JWT) y Control RBAC

## Contexto y problema

El proyecto tiene tres esqueletos recién iniciados y todavía **ninguna forma de identificar a quién usa
el sistema**:

- `backend` es Spring Boot con un único endpoint `/salud`: no hay seguridad, ni usuarios, ni
  persistencia, ni tokens.
- `frontend` es una app Expo con una sola pantalla que consulta `/salud`: no hay login, ni
  almacenamiento de credenciales, ni sesión.
- `backoffice` es un esqueleto Angular 22 con una pantalla de inicio que consulta `/salud`: sin login,
  sin guardas, sin manejo de tokens.

Ninguna funcionalidad posterior (planillas, visitas, supervisión) tiene sentido si cualquiera puede
consumir la API o si la app no sabe quién está operando. Esta tarea agrega la capa de autenticación y
autorización que el resto del ecosistema va a asumir como base: emisión y validación de tokens JWT,
control de acceso por roles (Operador, Supervisor, Administrador) y 2FA con TOTP, más lo que `frontend`
(app móvil) y `backoffice` (web) necesitan para loguear y guardar la sesión de forma segura.

El issue declara un alcance fullstack que **incluye un frontend web** (backoffice) y desbloqueo
biométrico/PIN. El repo `backoffice` ya existe y entra al alcance de esta tarea; el desbloqueo
biométrico/PIN sigue pendiente.

## Alcance

**Repos que toca:** `backend`, `frontend` (móvil), `backoffice` (web)

## Criterios de aceptación

1. `POST /auth/login` con credenciales de un usuario activo devuelve un access token JWT y un refresh
   token; con credenciales inválidas devuelve 401 **sin revelar si falló el usuario o la contraseña**.
2. Todos los endpoints de negocio existentes y futuros quedan protegidos por defecto: una petición sin
   token o con token inválido/expirado recibe 401, y con token válido pero rol insuficiente recibe 403.
3. `POST /auth/refresh` rota el refresh token: consume el anterior (queda invalidado y no reutilizable)
   y emite un par nuevo; un refresh token revocado, expirado o ya usado es rechazado con 401.
4. Las contraseñas se almacenan con BCrypt (factor 12) o Argon2id; nunca se devuelven por API, no
   aparecen en logs y no se almacena su texto plano en ningún momento.
5. El RBAC cubre los roles Operador, Supervisor y Administrador mediante `@PreAuthorize` sobre
   endpoints de ejemplo, con las reglas de acceso explícitas en la spec de clase/método.
6. El 2FA TOTP (RFC 6238) está soportado: un endpoint emite el secreto/QR para habilitarlo y otro
   verifica el código de 6 dígitos; si el usuario lo habilitó, el login exige el código. El desafío de
   verificación se canjea una sola vez y no se puede re-enrolar el 2FA sin deshabilitarlo antes.
7. Hay un control de fuerza bruta aplicado al login y a la verificación del código de 2FA (ventana
   temporal y límite de intentos) que bloquea o demora la cuenta/IP superado el umbral.
8. El esquema de datos cubre `users`, `roles`, `user_roles` y `refresh_tokens` (nombres en inglés por
   convención del proyecto); los datos de seed son ficticios y se documentan como tales.
9. La app móvil (`frontend`) muestra una pantalla de login que llama a `/auth/login`, guarda los tokens
   en SecureStore (Keychain/Keystore respaldado por hardware) y los adjunta como `Authorization: Bearer`
   en las peticiones autenticadas; ante 401 intenta refrescar y, si no puede, devuelve al login.
10. El backoffice (`backoffice`) tiene el login administrativo con soporte de 2FA, un `HttpInterceptor`
    que adjunta el Bearer y refresca ante 401 (con reintento de la petición original), y guardas de
    navegación que redirigen a `/login` cuando no hay sesión y a inicio cuando ya la hay.
11. Los gates verifican todo: compila, tests unitarios (hashing, expiración/revocación de tokens,
    integración con 401/403, interceptor/refresh), lint y tipos, en `backend`, `frontend` y `backoffice`.

## Fuera de alcance

- Registro de usuarios, alta/baja de cuentas y gestión de roles por UI: el seed provee los usuarios
  iniciales.
- Desbloqueo biométrico/PIN en la app: se anota como pendiente (el issue lo menciona) salvo que la
  respuesta a la pregunta abierta correspondiente lo incorpore.
- Integración con un proveedor de identidad externo existente (Keycloak, Okta, Auth0): pendiente de la
  decisión de la pregunta abierta N°2.
- Password reset / recuperación de cuenta.
- OTP por SMS/email (solo TOTP).

## Preguntas abiertas

- [x] `BLOQUEANTE` — **Persistencia**: **resuelta →** se usa **PostgreSQL** (el backend agrega capa de
      persistencia). En desarrollo se levanta con Docker Compose; los tests de integración corren
      contra la misma base en un esquema/instancia dedicada.
- [x] `BLOQUEANTE` — **OIDC**: **resuelta →** se implementa un **emisor de JWT propio** (login propio
      que firma los tokens con RS256). No hay IdP externo en esta tarea.
- [x] `BLOQUEANTE` — **2FA**: **resuelta →** el 2FA TOTP es **opcional por usuario**: la infraestructura
      (emitir secreto/QR, verificar código) queda completa y el login exige el código solo a los
      usuarios que lo habilitaron.
- [x] `NO-BLOQUEANTE` — **Superada**: la pregunta era si la parte "Frontend Web" quedaba fuera hasta que
      el repo `backoffice` exista. El repo ya existe: el **backoffice entra al alcance** de esta tarea
      (login administrativo con 2FA, `HttpInterceptor` y guardas, criterio 10).
- [ ] `NO-BLOQUEANTE` — El desbloqueo biométrico/PIN de la app: entra en esta tarea o queda anotado
      como post-MVP. Pendiente de resolver; no bloquea.