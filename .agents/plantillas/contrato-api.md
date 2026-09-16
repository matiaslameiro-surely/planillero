# Contrato de API — <CLAVE>

> Plantilla de la fase 3. **Lo escribe el backend, lo consume el frontend.**
> Es obligatorio cuando el alcance es `ambos`, y es lo que permite implementar el frontend
> sin tener el backend levantado.
>
> Si el frontend necesita algo que no está acá, **no lo inventa**: vuelve al backend.

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

> Los tipos que el frontend necesita declarar de su lado. Nombres y tipos exactos,
> para que no haya que deducirlos del JSON de ejemplo.

```ts
```

## Notas para el frontend

> Todo lo que no se ve en la firma: paginación, formato de fechas, zona horaria,
> unidades, qué campos pueden venir nulos, límites de tamaño.

-
