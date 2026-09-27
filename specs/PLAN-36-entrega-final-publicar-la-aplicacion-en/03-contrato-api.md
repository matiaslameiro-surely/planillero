# Contrato de API — PLAN-36

PLAN-36 no introduce nuevos endpoints de negocio, sino que ratifica los endpoints de infraestructura, salud y autenticación necesarios para el proxy inverso de NGINX, Traefik y la verificación del despliegue en producción.

## Endpoints

### `GET /health` (y alias `/salud`)

**Para qué:** Verificación de salud y disponibilidad del servicio por parte de Docker Compose, NGINX y Traefik.

**Autenticación:** pública

**Response 200**

```json
{
  "status": "UP"
}
```

---

### `POST /api/v1/auth/login`

**Para qué:** Autenticación de usuarios (incluyendo usuarios de demo en producción: `admin.demo`, `supervisor.demo`, `operador.demo`).

**Autenticación:** pública

**Request**

```json
{
  "username": "admin.demo",
  "password": "Admin123!"
}
```

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `username` | string | sí | Nombre de usuario |
| `password` | string | sí | Contraseña en texto plano |

**Response 200**

```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIs...",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

**Errores**

| Código | Cuándo | Cuerpo |
|---|---|---|
| 400 | Formato o campos faltantes | `{"error": "Bad Request", ...}` |
| 401 | Credenciales inválidas | `{"error": "Unauthorized", ...}` |
| 429 | Exceso de intentos fallidos (brute-force) | `{"error": "Too Many Requests", ...}` |

## Notas para los clientes

- En producción, el Backoffice accede a la API en el mismo origen (`/api/...`, `/health`), enrutado internamente por el proxy de NGINX hacia el backend Spring Boot.
- Traefik gestiona el certificado SSL en el borde (`https://planillero.ferchamorro.cloud`) y reenvía cabeceras estándar `X-Forwarded-Proto: https` y `X-Forwarded-For`.
