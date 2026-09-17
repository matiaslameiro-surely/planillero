# Tareas — PLAN-6

Checklist en orden de dependencia. Todo `[backend]` va antes que los clientes: el contrato de API lo
define el backend y lo consumen `[frontend]` y `[backoffice]`, que son independientes entre sí.

## backend

- [x] `[backend]` Verificar nombres de dependencias en Spring Boot 4.1.1 (`dependency:resolve`) y
      actualizar `pom.xml` (security, jpa, postgres, `spring-boot-starter-flyway`, totp, testcontainers)
- [x] `[backend]` `docker-compose.yml` con PostgreSQL local
- [x] `[backend]` Claves RSA: carga desde PEM si están configuradas; si no, par efímero en dev
- [x] `[backend]` Migraciones Flyway `V1__auth_schema.sql` (`users`, `roles`, `user_roles`,
      `refresh_tokens`) y `V2__auth_seed.sql` (datos ficticios)
- [x] `[backend]` Entidades y repositorios JPA
- [x] `[backend]` Hash bcrypt factor 12 (bean `PasswordEncoder`) con test unitario
- [x] `[backend]` `RefreshTokenService` con hash, rotación y revocación
- [x] `[backend]` TOTP: generación de secreto/URI otpauth y verificación RFC 6238 (con test)
- [x] `[backend]` `SecurityConfig` (Resource Server, rutas públicas, `@EnableMethodSecurity`),
      `JwtConfig`/`JwtProperties` y carga de claves
- [x] `[backend]` `AuthService` + `AuthController` (login con desafío 2FA, verify-2fa, refresh, logout,
      setup/enable/disable de 2FA)
- [x] `[backend]` `LoginAttemptService` (ventana temporal y bloqueo, con test), reutilizado para el
      código de 2FA (`2fa:<usuario>`)
- [x] `[backend]` `TwoFactorChallengeStore`: desafío canjeable una sola vez (`jti` + TTL, con test) y
      `409` al re-enrolar 2FA ya habilitado
- [x] `[backend]` `ApiExceptionHandler` (JSON de error consistente)
- [x] `[backend]` Endpoints de ejemplo protegidos por rol (`/roles/ejemplo-operador`, `/roles/ejemplo-admin`)
- [x] `[backend]` Ajustar `SaludControllerTest`; tests de integración con Testcontainers
      (401 sin token, 403 por rol, refresh rotativo, 2FA)
- [x] `[backend]` Emitir `03-contrato-api.md`

## frontend (app móvil)

- [x] `[frontend]` Leer `03-contrato-api.md` antes de empezar
- [x] `[frontend]` Agregar `expo-secure-store` (dependencia + plugin en `app.json`)
- [x] `[frontend]` `tokenStore` sobre SecureStore (con respaldo en memoria donde no hay almacén seguro)
- [x] `[frontend]` `api/auth.ts`: login, verify-2fa, logout, /auth/me, 2FA
- [x] `[frontend]` `api/client.ts`: adjuntar Bearer y refresco automático ante 401 (con test)
- [x] `[frontend]` `SessionContext` (usuario, roles, signIn/signOut) y proteger rutas en `_layout`
- [x] `[frontend]` Pantalla de login con paso 2FA y mensajes que no revelan campo
- [x] `[frontend]` Home protegida: usuario, rol, estado de `/salud` y cierre de sesión
- [x] `[frontend]` Tests de cliente (Bearer, 401→refresh) y lint/tipos en verde

## backoffice (web)

- [x] `[backoffice]` Leer `03-contrato-api.md` antes de empezar
- [x] `[backoffice]` `auth.model.ts` (tipos de tokens, sesión y roles) y `token-store.service.ts`
      (access en memoria, refresh en `localStorage` con respaldo en memoria)
- [x] `[backoffice]` `auth.service.ts`: login, verify-2fa, refresh, logout y /auth/me
- [x] `[backoffice]` `auth.interceptor.ts`: Bearer + refresh compartido ante 401 con reintento
- [x] `[backoffice]` Guardas `authenticated` y `anonymous`, y registro en `app.config.ts`
- [x] `[backoffice]` Página `login` (formulario + paso 2FA) y ruta en `app.routes.ts`
- [x] `[backoffice]` `home` con usuario/roles y cierre de sesión
- [x] `[backoffice]` Pruebas de `auth.service` e interceptor + lint/tipos en verde

## Verificación

- [x] Gates en verde en los repos del alcance (`node .agents/scripts/verificar.mjs --tarea PLAN-6`):
      backend 24 tests, frontend 13, backoffice 18
- [x] Revisión independiente sin hallazgos `critical` ni `high` (ronda 2 de backend: `approve`; los
      `medium`/`low` restantes van al cuerpo del PR)
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto
