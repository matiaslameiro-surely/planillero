# Tareas de Implementación - PLAN-17

## Tareas Backend

- [ ] **[backend] Configurar Headers de Seguridad HTTP en `SecurityConfig.java`**
  - Añadir CSP, HSTS, X-Frame-Options y X-Content-Type-Options.
  - Verificar que los tests de integración de seguridad sigan pasando.

- [ ] **[backend] Validar Inmutabilidad de Auditoría y Verificación de Cadena**
  - Ejecutar tests unitarios e integración de `AuditChainService` y `AuditController`.
  - Confirmar el funcionamiento de `GET /api/v1/audit/verify`.

- [ ] **[backend] Generar `security-log.md` e `informe.md` en Backend**
  - Redactar la matriz con los 4 riesgos (OWASP/Privacidad/Acceso/API Keys).
  - Incluir la sección de verificación de secretos y no repudio.

## Tareas Frontend

- [ ] **[frontend] Generar `security-log.md` en Frontend**
  - Documentar el almacenamiento seguro en `expo-secure-store`, encriptación de SQLite con SQLCipher y uso de SHA-256 en evidencias.

## Tareas Backoffice

- [ ] **[backoffice] Generar `security-log.md` en Backoffice**
  - Documentar la protección de rutas mediante Guards, manejo de tokens en memoria/localStorage y mitigaciones XSS.

## Tareas de Cierre y Documentación General

- [ ] **[general] Consolidar Informe Final y Guion de Video Demostrativo**
  - Crear `informe.md` consolidado con la plantilla para la URL del video demostrativo de 3 minutos.
