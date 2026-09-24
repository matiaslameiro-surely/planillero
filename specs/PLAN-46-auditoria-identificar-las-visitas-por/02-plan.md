# Plan técnico — PLAN-46

## Enfoque

**Backend primero.**
- `AuditController.logs()`: después de paginar, junta los `entityId` de las filas `VISIT` que son
  UUID válidos y los resuelve con **un** `visitRepository.findAllById(...)`. Cada DTO sale con
  `entityCode`.
- `verify` pasa a recibir `visitId` como `String`: si está vacío, verifica la cadena completa; si es
  UUID, lo usa; si no, busca por código (`findByCode`). Si no hay visita, responde 404.
- `ApiExceptionHandler` suma un handler para `MethodArgumentTypeMismatchException` con un mensaje en
  español.

**Backoffice después**, consumiendo `03-contrato-api.md`:
- el modelo suma `entityCode`;
- la celda muestra el código y un botón para copiar el UUID;
- el campo de verificación valida el formato antes de enviar;
- el placeholder del filtro pasa a ser descriptivo.

## Archivos a tocar

### backend/

| Archivo | Acción | Para qué |
|---|---|---|
| `audit/dto/AuditLogDto.java` | modificar | Campo `entityCode` y fábrica que lo recibe |
| `audit/AuditController.java` | modificar | Resolver códigos por página y `verify` con UUID o código |
| `planning/VisitRepository.java` | modificar | `Optional<Visit> findByCode(String code)` |
| `common/ApiExceptionHandler.java` | modificar | Handler de `MethodArgumentTypeMismatchException` en español |
| `src/test/.../audit/AuditIntegrationTest.java` | modificar | `entityCode` en logs, verify por código, 404 y cadena íntegra |

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `core/models/audit.model.ts` | modificar | `entityCode: string \| null` |
| `pages/auditoria/auditoria.ts` | modificar | Validación de ID o código, copiar el UUID y mensaje del 404 |
| `pages/auditoria/auditoria.html` | modificar | Celda con código y botón copiar, placeholder y texto del campo |
| `pages/auditoria/auditoria.spec.ts` | modificar | Casos de los criterios 5 a 7 |

Total: 9 archivos, dentro del límite. El checkpoint del plan igual está configurado.

## Decisiones técnicas

- **Resolver el código en el controller con `findAllById`, en lugar de un join en JPQL.**
  `audit_logs.entity_id` es `varchar` y `visits.id` es `uuid`: el join necesitaría casts y una
  consulta nueva sobre la tabla de auditoría. Una consulta extra por página, sobre la clave primaria,
  es simple y no es N+1.
- **`verify` con el mismo parámetro `visitId`** que acepta los dos formatos, en lugar de uno nuevo
  (`visitCode`). El backoffice ya lo manda y no cambia la URL.
- **404 y no 400** cuando el valor es válido pero no existe: la petición está bien formada y lo que
  falta es el recurso.

## Supuestos

- `entityId` de las filas `VISIT` es el UUID de la visita en texto. Verificado: lo escribe
  `AuditAspect` con el ID de la visita.
- Los códigos tienen la forma `V-<número>`. El backoffice valida contra un patrón genérico
  (`<letras>-<números>`), para no atarse a la letra.

## Cómo se prueba

1. Test de integración del backend (Testcontainers; Docker está corriendo).
2. Specs del backoffice.
3. `node .agents/scripts/verificar.mjs --tarea PLAN-46`.
4. En local: la columna muestra `Visita V-1001`, verificar con `V-1001` y con `66`.
