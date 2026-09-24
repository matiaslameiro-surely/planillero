# PLAN-44 — Backoffice: no mandar el token a los endpoints públicos y renovar la sesión antes de que venza (sin 401 en la consola)

## Contexto y problema

Al utilizar el backoffice en el navegador, se detectaron errores HTTP 401 (Unauthorized) en la consola al realizar peticiones en dos escenarios de uso habitual:
1. Al consultar endpoints públicos como `/salud` o `/health` teniendo un token vencido o inválido en almacenamiento. Actualmente, `auth.interceptor.ts` añade la cabecera `Authorization: Bearer <token>` a todas las peticiones excepto las definidas en `PUBLIC_AUTH_PATHS` (`/auth/login`, `/auth/verify-2fa`, `/auth/refresh`). Cuando Spring Boot recibe un header `Bearer` con firma o tiempo inválido, rechaza la petición con 401 aun cuando la ruta esté configurada con `permitAll`.
2. Al reanudar la interacción tras más de 15 minutos de inactividad (por ejemplo, manteniendo abierto el tablero de Supervisión). La renovación actual del access token es reactiva: espera a que una petición autenticada falle con 401 para capturar el error, llamar a `/auth/refresh` y reintentar. Aunque para el usuario es transparente, produce logs de error 401 visibles e indeseados en la consola del navegador.

Es necesario que el interceptor no envíe credenciales a endpoints públicos y que implemente una renovación proactiva del token verificando su expiración (`exp`) antes de despachar solicitudes autenticadas, manteniendo la recuperación reactiva ante 401 como mecanismo de contingencia.

## Alcance

**Repos que toca:** `backoffice`

## Criterios de aceptación

1. **Exclusión de endpoints públicos:** Con el token vencido, inválido o ausente, las peticiones dirigidas a endpoints públicos (incluyendo `/salud` y `/health`, además de las rutas de login/2fa/refresh) se envían sin la cabecera `Authorization`. La consulta de `/salud` desde Inicio no genera error 401.
2. **Renovación proactiva antes de expirar:** Al intentar realizar una petición autenticada cuando el access token está vencido o a punto de vencer (faltando menos de ~30 segundos para su timestamp `exp`), el interceptor dispara la renovación (`/auth/refresh`) antes de enviar la petición original, evitando que la llamada genere un 401 en la consola.
3. **Deduplicación de renovaciones en vuelo:** Si ocurren múltiples peticiones simultáneas mientras el token está por vencer o vencido, todas deben encolarse o esperar una única llamada de refresh compartida en lugar de disparar múltiples peticiones de renovación en paralelo.
4. **Respaldo reactivo ante 401:** Si una petición autenticada recibe un código 401 (por ejemplo, desincronización de reloj o revocación de token), el interceptor mantiene su comportamiento de rescate: intenta renovar el token y reintentar la solicitud.
5. **Autenticación preservada:** Las peticiones a rutas protegidas continúan adjuntando `Authorization: Bearer <token>` normalmente cuando la sesión es válida.
6. **Cobertura de pruebas y gates:** El archivo de pruebas del interceptor de autenticación (`auth.interceptor.spec.ts`) cubre los nuevos casos (no inclusión de token en endpoints públicos, refresh proactivo previo a expiración, concurrencia de refrescos) y los gates determinísticos de `backoffice` pasan en limpio.

## Fuera de alcance

- Modificaciones en el backend (`backend` / Spring Boot).
- Modificaciones en la aplicación móvil (`frontend`).
- Invalidación de sesión por reinicio del backend en entorno local de desarrollo (generación efímera de claves JWT sin configuración persistente).

## Preguntas abiertas

Ninguna.
