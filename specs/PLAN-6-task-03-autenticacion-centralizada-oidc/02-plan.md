# Plan técnico — PLAN-6

## Enfoque

El backend pasa de "sin seguridad" a exponer la autenticación del ecosistema: un **emisor propio de
JWT (RS256)** con Spring Security 6 en modo **Resource Server** (validación de `Bearer`), persistencia
**PostgreSQL** vía JPA + Flyway, contraseñas con bcrypt (factor 12), **refresh tokens rotativos con
revocación** (guardados hasheados), **2FA TOTP opcional por usuario** y **RBAC** mediante
`@PreAuthorize`. Todos los endpoints quedan protegidos por defecto salvo `POST /auth/*` y `/salud`.

El frontend agrega el flujo de sesión: **SecureStore** (Keychain/Keystore) para los tokens, pantalla de
**login con soporte 2FA**, un contexto de sesión que protege la navegación y un cliente de API que
adjunta el Bearer y **refresca automáticamente ante 401**. El diagnóstico de `/salud` se conserva.

El **backoffice** suma el login administrativo sobre los mismos endpoints: un servicio de autenticación
que mantiene la sesión (access token en memoria, refresh en `localStorage`), un **`HttpInterceptor`
funcional** que adjunta el Bearer y refresca ante 401 con reintento de la petición, y **guardas de
navegación** (redirect a `/login` sin sesión, a inicio con sesión) con restauración de sesión vía
`GET /auth/me` al arrancar.

Orden estricto: el backend define el contrato (`03-contrato-api.md`) y los clientes lo consumen; el
`backoffice` sí está en el alcance ahora que el repo existe.

## Archivos a tocar

### backend/

| Archivo | Acción | Para qué |
|---|---|---|
| `pom.xml` | modificar | Spring Security (resource-server), Data JPA, driver PostgreSQL, `spring-boot-starter-flyway`, TOTP, Testcontainers |
| `src/main/resources/application.properties` | modificar | Datasource, JPA, Flyway, JWT (emisor/expiración), 2FA, locks |
| `docker-compose.yml` | crear | PostgreSQL local de desarrollo (datos ficticios, ignorados) |
| `src/main/resources/db/migration/V1__auth_schema.sql` | crear | `users`, `roles`, `user_roles`, `refresh_tokens` |
| `src/main/resources/db/migration/V2__auth_seed.sql` | crear | Seed de usuarios ficticios y roles |
| `src/main/resources/jwt/` | — | No se versionan claves: en dev se genera un par efímero; en producción se montan por entorno |
| `src/main/java/.../user/{User,Role,RoleName,UserRepository,RoleRepository}.java` | crear | Entidades y repositorios JPA |
| `src/main/java/.../auth/{AuthService,AuthController}.java` | crear | Login, 2FA, refresh, logout |
| `src/main/java/.../auth/dto/*.java` | crear | Cuerpos de request/response del contrato |
| `src/main/java/.../security/SecurityConfig.java` | crear | Cadena de filtros, rutas públicas, `@EnableMethodSecurity` y bean `PasswordEncoder` (bcrypt factor 12) |
| `src/main/java/.../security/{JwtConfig,JwtProperties,AuthProperties}.java` | crear | Clave RSA (PEM o efímera) y configuración de tokens/intentos |
| `src/main/java/.../security/{RestAuthenticationEntryPoint,RestAccessDeniedHandler}.java` | crear | Cuerpo JSON consistente para 401 y 403 |
| `src/main/java/.../auth/RefreshTokenService.java` | crear | Emisión, rotación, revocación y hash de refresh tokens |
| `src/main/java/.../auth/{TokenService,TotpService}.java` | crear | Emisión/validación de JWT y TOTP (RFC 6238) |
| `src/main/java/.../auth/LoginAttemptService.java` | crear | Ventana de intentos y bloqueo temporal por usuario |
| `src/main/java/.../auth/{TwoFactorChallenge,TwoFactorChallengeStore}.java` | crear | Desafío de 2FA canjeable una sola vez (registro en memoria con TTL) |
| `src/main/java/.../common/{ApiException,ApiExceptionHandler}.java` | crear | Excepciones de negocio y traducción a JSON |
| `src/main/java/.../roles/RoleExampleController.java` | crear | Endpoints de ejemplo protegidos por rol |
| `src/test/java/.../AbstractIntegrationTest.java` | crear | Testcontainers (PostgreSQL real) para los tests de integración |
| `src/test/java/.../security/PasswordEncoderTest.java` | crear | Tests unitarios de hashing |
| `src/test/java/.../auth/{TotpServiceTest,LoginAttemptServiceTest,TwoFactorChallengeStoreTest}.java` | crear | TOTP, control de fuerza bruta y desafío de un solo uso |
| `src/test/java/.../auth/AuthIntegrationTest.java` | crear | Login → refresh → 2FA y 401/403 de integración |
| `src/test/java/.../salud/SaludControllerTest.java` | modificar | Ajustar a que `/salud` sigue siendo público con seguridad activa |

### frontend/

| Archivo | Acción | Para qué |
|---|---|---|
| `package.json` | modificar | Agregar `expo-secure-store` |
| `app.json` | modificar | Registrar el plugin de secure-store |
| `src/auth/tokenStore.ts` | crear | Leer/escribir/borrar tokens en SecureStore |
| `src/auth/SessionContext.tsx` | crear | Estado de sesión (logueado, usuario, roles) + proveedor |
| `src/api/client.ts` | crear (renombra `cliente.ts`) | Adjuntar Bearer, manejar 401 con refresh y reintento; `getHealth` |
| `src/api/auth.ts` | crear | `login`, `verifyTwoFactor`, `logout`, `getMe`, `setup/enable/disableTwoFactor` |
| `src/app/_layout.tsx` | modificar | Envolver con el proveedor de sesión |
| `src/app/login.tsx` | crear | Formulario login + paso 2FA (mensajes sin revelar usuario/campo) |
| `src/app/index.tsx` | modificar | Home protegida: muestra usuario, rol y estado de `/salud`; cerrar sesión |
| `src/api/client.test.ts`, `src/auth/tokenStore.test.ts` | crear | Tests de cliente (Bearer, 401→refresh) y del almacén, con fetch/SecureStore mockeados |

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/core/models/auth.model.ts` | crear | Tipos: tokens, sesión, roles, resultado de login/2FA |
| `src/app/core/services/auth.service.ts` | crear | `login`, `verify2fa`, `refresh`, `logout`, `me`; mantiene la sesión |
| `src/app/core/services/token-store.service.ts` | crear | Access token en memoria y refresh token en `localStorage` |
| `src/app/core/interceptors/auth.interceptor.ts` | crear | Adjunta Bearer; ante 401 refresca (única cola) y reenvía; si falla, cierra sesión |
| `src/app/core/guards/authenticated.guard.ts` | crear | `canActivate` funcional: sin sesión → `/login` |
| `src/app/core/guards/anonymous.guard.ts` | crear | `canActivate` funcional: con sesión → `/` |
| `src/app/core/models/health.model.ts` + `core/services/health.service.ts` | renombrar desde `salud.*` | Mismo `/salud`, identificadores en inglés |
| `src/app/pages/login/login.ts`, `login.html`, `login.scss` | crear | Formulario login + paso 2FA (mensajes sin revelar campo) |
| `src/app/pages/home/home.ts`, `home.html`, `home.scss` | renombrar desde `inicio` + modificar | Muestra usuario/roles, estado de `/salud` y botón de cerrar sesión |
| `src/app/app.routes.ts` | modificar | Rutas `''` (protegida) y `login` (anónima) con sus guardas, carga diferida |
| `src/app/app.config.ts` | modificar | Registrar el interceptor en `provideHttpClient` |
| `src/app/core/services/__tests__/auth.service.spec.ts` | crear | Sesión: login, 2FA, refresh, restauración y logout |
| `src/app/core/interceptors/__tests__/auth.interceptor.spec.ts` | crear | Bearer presente, 401→refresh→reintento, sesión cerrada si el refresh falla |

## Decisiones técnicas

- **Emisor propio de JWT RS256** — Se descartó HS512 simétrico porque reparte el secreto a cada
  consumidor y resta la separación firma/verificación; y un IdP externo porque el usuario confirmó que
  no hay IdP en esta tarea. Con RS256 el backend firma y los clientes validan con la clave pública.
- **Claves RSA: efímeras en dev, configurables por entorno** — No se versiona ninguna clave privada
  (ni "de desarrollo"). Si hay PEM configurados se usan; si no, desarrollo genera un par efímero en
  memoria y lo avisa por log. Se descartó versionar claves de dev porque una clave privada en el repo
  es una mala costumbre que después se copia a producción.
- **Refresh tokens hasheados (SHA-256) en la DB** — Se descartó guardar el token crudo: si se filtra la
  base, un atacante no puede reusarlos.
- **Rotación con revocación** — Se descartó un refresh reutilizable: al usarse se invalida el anterior y
  se emite uno nuevo, evitando replay.
- **2FA TOTP opcional con desafío corto** — El login devuelve `twoFactorRequired` + `challengeId`
  (JWT breve de un solo uso); luego `POST /auth/verify-2fa`. Se descartó exigir el código dentro del
  mismo login porque obliga a reintentar la contraseña en cada error de código.
- **Desafío de 2FA de un solo uso** — El `challengeId` lleva un `jti` y el backend recuerda los ya
  canjeados durante la ventana de validez (`TwoFactorChallengeStore`, en memoria, sin persistencia);
  reintentar con el mismo desafío devuelve `401 invalid_challenge`. Se descartó confiar sólo en la
  expiración del JWT: un token interceptado servía dos veces.
- **Re-enrolar 2FA exige deshabilitarlo antes** — `POST /auth/2fa/setup` con el 2FA ya habilitado
  responde `409 two_factor_already_enabled` en lugar de pisar el secreto. Se descartó permitir el
  reemplazo directo: con un access token robado, cualquiera podía regenerar el secreto y quedarse con
  el segundo factor (equivalía a apagarlo sin código).
- **Flyway para esquema y seed** — Se descartó `ddl-auto=update`: no versiona y no es determinístico.
  El seed de usuarios es ficticio de forma explícita.
- **bcrypt factor 12 a través de una interfaz de hashing** — Se descartó Argon2id directo como única
  opción porque el stack de Spring Security trae bcrypt naturalmente; la interfaz deja Argon2 como
  alternativa sin reescribir el resto.
- **Fuerza bruta en memoria (ventana por usuario)** — Se descartó persistir intentos en la DB: más
  robusto pero deja esta iteración más grande; el límite en memoria cubre el caso pedido (OWASP A07).
  El mismo servicio se reutiliza para el código de 2FA con una clave aparte (`2fa:<usuario>`), así el
  umbral del código no se mezcla con el de la contraseña.
- **Tests de integración con Testcontainers (Postgres real)** — Se descartó H2 en los tests porque no
  refleja el comportamiento de PostgreSQL. Requiere Docker corriendo durante los gates.
- **SecureStore para los tokens (frontend)** — Se descartó AsyncStorage: no está respaldado por el
  almacenamiento cifrado de Keychain/Keystore.
- **Sesión como contexto + rutas protegidas en expo-router** — Se descartó manejar el estado de sesión
  por pantalla: se propaga mal y no permite guardar el acceso de navegación en un solo lugar.
- **Idioma del código: inglés en los tres repos** — `AGENTS.md` lo pide y el usuario lo confirmó. Los
  esqueletos de `frontend` y `backoffice` venían en español, así que se renombran sus identificadores
  y archivos al tocarlos (`cliente.ts` → `client.ts`, `SaludService` → `HealthService`, etc.). Los
  comentarios siguen en español. Las claves del JSON de `/salud` (`estado`, `momento`) se dejan como
  están: son un contrato ya entregado (PLAN-2) y cambiarlas rompería a sus consumidores.
- **Backoffice: access token en memoria + refresh en `localStorage`** — Se descartó guardar ambos tokens
  en memoria (se pierde la sesión al recargar) y usar httpOnly cookies (escapa del "interceptor Bearer"
  que pide el issue y obligaría a coordinar cookies con el backend). El refresh en `localStorage`
  restaura la sesión al recargar; la exposición a XSS se anota como limitación conocida (mejora futura:
  cookies httpOnly o Authorization Code + PKCE).
- **Backoffice: `HttpInterceptor` funcional** — Angular 22 usa interceptors funcionales; se comparte una
  sola llamada de refresh para no golpear `/auth/refresh` en paralelo ante 401 simultáneos.
- **Backoffice: guardas funcionales (`canActivate`)** — Las rutas administrativas (no solo `/`) quedan
  protegidas por la guarda, y la sesión se restaura con `GET /auth/me` al arrancar para que el refresco
  de la pestaña no tire al login si el refresh token sigue vigente.

## Contrato de API (alto nivel)

| Método | Ruta | Request | Response |
|---|---|---|---|
| `POST` | `/auth/login` | `{username, password}` | `200 {accessToken, refreshToken}` · `200 {twoFactorRequired:true, challengeId}` · `401` |
| `POST` | `/auth/verify-2fa` | `{challengeId, code}` | `200 {accessToken, refreshToken}` · `401` · `429` |
| `POST` | `/auth/refresh` | `{refreshToken}` | `200 {accessToken, refreshToken}` · `401` |
| `POST` | `/auth/logout` | `{refreshToken}` | `204` |
| `POST` | `/auth/2fa/setup` | Bearer | `200 {secret, otpauthUri}` (secreto pendiente) · `409` si ya está habilitado |
| `POST` | `/auth/2fa/enable` | Bearer + `{code}` | `204` |
| `POST` | `/auth/2fa/disable` | Bearer + `{code}` | `204` |
| `GET` | `/auth/me` | Bearer | `200 {username, roles:[], twoFactorEnabled}` · `401` |
| `GET` | `/salud` | — | `200` (público) |
| `GET` | `/roles/ejemplo-operador` | Bearer Operador+ | `200` · `403` |
| `GET` | `/roles/ejemplo-admin` | Bearer Administrador | `200` · `403` |

Los códigos de error y la forma exacta de los cuerpos se fijan en `03-contrato-api.md` (fase 3).

## Supuestos

- `RIESGO` **Docker activo durante los gates** del backend: los tests de integración usan
  Testcontainers y levantan PostgreSQL. Verificado en esta máquina (Docker 29.5.3 corriendo), pero es
  infraestructura que todo dev necesita.
- `RIESGO` **Nombres de starters de Spring Boot 4.1.1**: el esqueleto ya usa
  `spring-boot-starter-webmvc` (antes era `web`); asumo que Security/Data JPA/Testcontainers existen
  con nombres análogos y se confirman al resolver dependencias en la fase 3.
- `RIESGO` **Descarga de la imagen `postgres`** desde Docker Hub la primera vez (requiere red).
- Puertos `8080` (API) y `5432` (Postgres local) disponibles o configurables por env.
- `gh` autenticado con scope `repo` (verificado) para ramas y PRs.
- Los datos del seed (usuarios, legajos) son **ficticios**.
- El repo `backoffice` ya existe en la organización (lo creó el usuario) y su `package.json` exige
  `node ^22.22.3 || ^24.15.0 || >=26.0.0`; la máquina usa 26.9.0, compatible con ese rango.

## Cómo se prueba

- **Gates:** `node .agents/scripts/verificar.mjs --tarea PLAN-6` (compila, tests, lint y tipos en
  backend y frontend).
- **Manual backend:** `docker compose up -d` → `./mvnw spring-boot:run` → con `curl`: login
  (credenciales ficticias del seed), verificar un 401 sin token y un 403 con rol menor, refrescar y
  comprobar que el refresh viejo ya no sirve, habilitar 2FA y completar el login en dos pasos.
- **Manual frontend:** app Expo levantada contra el backend, login con usuario sin 2FA y con 2FA,
  cierre de sesión y recarga de pantalla sin perder la sesión.
- **Manual backoffice:** `ng serve` contra el backend, login administrativo con y sin 2FA, cerrar
  sesión, expirar el access token y verificar que el interceptor refresca solo, y recargar la pestaña
  sin perder la sesión (vía `GET /auth/me`).
- **Coverage de criterios:** los criterios 1–11 de `01-spec.md` quedan mapeados a tests o a los pasos
  manuales de arriba.