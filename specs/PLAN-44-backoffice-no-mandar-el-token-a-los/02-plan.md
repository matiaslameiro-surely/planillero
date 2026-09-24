# Plan técnico — PLAN-44

## Enfoque

Resolver los errores 401 en la consola del navegador mediante dos ajustes complementarios en el interceptor HTTP de autenticación de Angular (`auth.interceptor.ts`):
1. **Exclusión de rutas públicas:** Extender la lista de exclusión para abarcar todos los endpoints públicos conocidos (`/salud`, `/health`, `/auth/login`, `/auth/verify-2fa`, `/auth/refresh`, `/auth/logout`). Cualquier petición a estos endpoints se despacha sin adjuntar la cabecera `Authorization` y sin ejecutar lógica de refresco o reintento ante 401.
2. **Renovación proactiva del token:** Inspeccionar el payload del access token (extrayendo el claim numérico `exp` en formato epoch seconds). Si el token ya venció o le restan menos de 30 segundos de vigencia, y existe un refresh token disponible en almacenamiento, disparar `auth.refresh()` antes de enviar la petición. Como `AuthService.refresh()` ya implementa deduplicación de refrescos en vuelo mediante `shareReplay`, múltiples peticiones concurrentes con token por vencer compartirán automáticamente la misma llamada a `/api/v1/auth/refresh`.
3. **Mantenimiento del respaldo reactivo:** Conservar la captura de respuestas 401 mediante `catchError` para reintentar con refresh en casos imprevistos (reloj local desincronizado, revocación de credenciales, o tokens de prueba que no especifiquen `exp`).

## Archivos a tocar

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/core/interceptors/auth.interceptor.ts` | modificar | Excluir endpoints públicos del Bearer y ejecutar renovación proactiva si el token vence en <= 30 segundos. |
| `src/app/core/interceptors/__tests__/auth.interceptor.spec.ts` | modificar | Añadir tests unitarios de exclusión de rutas públicas, renovación proactiva previa al envío, deduplicación concurrente y respaldo ante 401. |

## Decisiones técnicas

- **Decodificación liviana de JWT en el interceptor** — Se descartó incorporar una biblioteca externa como `jwt-decode` o `@auth0/angular-jwt` porque el access token es un JWT estándar emitido por Spring Boot cuyo payload es un JSON serializado en Base64Url. Una función utilitaria pura de pocas líneas (`atob` + `JSON.parse`) evita agregar dependencias externas a `package.json` para una única operación de lectura.
- **Detección tolerante de expiración** — Se descartó considerar automáticamente como vencidos los tokens que no tengan estructura JWT o no definan el claim `exp`. Al tratarlos como válidos para envío inmediato y delegar en el 401 reactivo si el servidor los rechaza, se preserva compatibilidad con los fixtures de prueba existentes (`accessToken: 'a1'`) y cualquier entorno de mock.
- **Reutilización del mecanismo `refresh()` de `AuthService`** — Se descartó reimplementar en el interceptor la lógica de encolado o un `Subject`/`BehaviorSubject` manual para peticiones concurrentes. `AuthService.refresh()` ya gestiona `refreshInFlight$` con `shareReplay({ bufferSize: 1, refCount: false })`, garantizando un único request HTTP a `/api/v1/auth/refresh` compartido entre todas las suscripciones activas.

## Supuestos

- Ninguno.

## Cómo se prueba

1. **Pruebas unitarias de interceptor (`auth.interceptor.spec.ts`):**
   - Caso ruta pública: petición a `/salud` y `/health` no incluye header `Authorization` aunque el store contenga un token expirado.
   - Caso token por expirar (< 30s) o expirado: petición a `/api/v1/auth/me` dispara primero `POST /api/v1/auth/refresh` y luego la petición original con el nuevo token, sin emitir ningún 401.
   - Caso peticiones concurrentes: dos peticiones simultáneas con token expirado generan una única llamada a `/api/v1/auth/refresh`, y ambas completan exitosamente con el nuevo token.
   - Caso token válido (> 30s): petición a `/api/v1/auth/me` se envía inmediatamente con el Bearer token sin llamar a refresh.
   - Caso 401 reactivo de respaldo: respuesta 401 ante token en apariencia válido dispara refresh y reintento.
2. **Suite de pruebas de backoffice:** `npm test` ejecuta todos los tests de Angular/Vitest pasando en verde.
3. **Build y linter:** `npm run lint` y `npm run build` sin advertencias ni errores.
