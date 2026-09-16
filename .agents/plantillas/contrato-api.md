# Contrato de API — <CLAVE>

> Plantilla de la fase 3. **Lo escribe el backend, lo consumen todos los clientes** (móvil y backoffice).
> Es obligatorio cuando el alcance incluye algún cliente, y es lo que permite implementarlos sin
> tener el backend levantado.
>
> Si un cliente necesita algo que no está acá, **no lo inventa**: vuelve al backend, y el contrato se
> actualiza para todos.

## Endpoints

### `<MÉTODO> /ruta`

**Para qué:**

**Autenticación:** requerida / pública

**Request**

```json
{}
```

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| | | sí / no | |

**Response 200**

```json
{}
```

**Errores**

| Código | Cuándo | Cuerpo |
|---|---|---|
| 400 | | |
| 401 | | |
| 404 | | |

## Modelos compartidos

> Los tipos que los clientes necesitan declarar de su lado. Nombres y tipos exactos,
> para que no haya que deducirlos del JSON de ejemplo.

```ts
```

## Notas para los clientes

> Todo lo que no se ve en la firma: paginación, formato de fechas, zona horaria,
> unidades, qué campos pueden venir nulos, límites de tamaño.

-
