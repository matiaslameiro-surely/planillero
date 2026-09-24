# PLAN-17: Ciberseguridad y Demo - Matriz de Riesgos OWASP, Secretos y Video Demostrativo

## Contexto y problema

Auditoría integral de seguridad según la Sección 6 del archivo `docs/Entrega final curso.pdf` y preparación de evidencias. El proyecto Planillero tiene una arquitectura completa con backend (Spring Boot 4.1.1 + Java 21), frontend (React Native + Expo) y backoffice (Angular), pero presenta aspectos de seguridad que deben ser auditados, documentados y corregidos.

**Estado actual:**
- **Backend**: JWT RS256, 2FA TOTP, RBAC (OPERATOR/SUPERVISOR/ADMINISTRATOR), BCrypt(12), auditoría inmutable con cadena SHA-256, `AuditMasker` para enmascarar datos sensibles en logs.
- **Frontend**: Tokens en `expo-secure-store`, SQLite con `useSQLCipher: true`, SHA-256 de evidencias.
- **Backoffice**: Refresh token en `localStorage` (riesgo XSS), acceso protegido mediante Angular Router Guards por rol.

## Alcance

`backend`, `frontend`, `backoffice`

## Criterios de aceptación

1. ✅ **Log de consideraciones de seguridad (`security-log.md`)**: Documento en la raíz de los tres repositorios con la matriz de al menos 4 riesgos de seguridad (OWASP / Privacidad / Acceso / API Keys) identificados, su impacto y las medidas técnicas tomadas o decisiones de diseño.
2. ✅ **No exposición de secretos**: Verificación completa de que ningún secreto ni clave privada está versionado en Git (`.env` en `.gitignore`, llaves RSA y API keys manejadas mediante variables de entorno y no strings hardcodeadas).
3. ✅ **Verificación de cadena de custodia, inmutabilidad y no repudio**:
   - `GET /api/v1/audit/verify` ejecuta la verificación de la cadena SHA-256 y retorna `ok: true`.
   - Triggers PostgreSQL en `audit.audit_logs` previenen `UPDATE` y `DELETE`.
4. ✅ **Video demostrativo**: Guion y grabación del video del ciclo de uso real (máximo 3 minutos) enlazado públicamente en el informe.

## Fuera de alcance

- Refactorizaciones estructurales de arquitectura de auth que rompan la compatibilidad actual.
- Integración real con un Vault externo en runtime (se documenta la estrategia de inyección por variables de entorno / secreto en despliegue).

## Preguntas abiertas / Supuestos

1. **PDF Sección 6**: Se asume la matriz de 4 riesgos basada en la especificación entregada en el prompt del usuario y el análisis del código.
2. **Video demostrativo**: Se incluye el guion exacto de 3 minutos y la plantilla para insertar la URL pública del video en el informe final.
