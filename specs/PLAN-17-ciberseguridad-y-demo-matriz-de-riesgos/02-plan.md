# Plan Técnico - PLAN-17: Ciberseguridad y Demo

## Enfoque General

La tarea PLAN-17 requiere consolidar la postura de seguridad del ecosistema Planillero mediante:
1. **Identificación y mitigación activa** de 4 riesgos de seguridad críticos en la matriz OWASP/Privacidad/Acceso/Secretos.
2. **Refuerzo técnico en código**:
   - Backend: Añadir headers de seguridad HTTP (`X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Content-Security-Policy`) en `SecurityConfig.java`.
   - Backend/Docker: Asegurar que el manejo de `.env` y secretos no exponga claves en el repositorio Git.
   - Backoffice: Documentar e implementar protección contra fijeza/XSS en el manejo de tokens.
3. **Verificación de Inmutabilidad y Cadena de Custodia**: Validar con test/script el endpoint `/api/v1/audit/verify` y los triggers de PostgreSQL.
4. **Entregables de Auditoría**: Generar los archivos `security-log.md` y `informe.md` con la matriz de riesgos, evidencias de no exposición de secretos y el enlace al video demostrativo.

---

## Decisiones Técnicas y Arquitectura

### 1. Headers de Seguridad HTTP en Spring Security
Se configurará `SecurityConfig.java` para inyectar explícitamente headers de seguridad mediante el DSL de Spring Security 6:
- `X-Frame-Options: DENY` (Protección Clickjacking)
- `X-Content-Type-Options: nosniff` (Protección MIME sniffing)
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (HSTS)
- `Content-Security-Policy: default-src 'self'` (CSP)

### 2. Matriz de 4 Riesgos OWASP / Privacidad / Acceso / API Keys
- **Riesgo 1 (API Keys / Secretos)**: Exposición accidental de claves o secretos en código fuente / Git.
  - *Mitigación*: Uso estricto de `.env` (ignorado en `.gitignore`), claves JWT RSA generadas dinámicamente o inyectadas por variable de entorno, verificación con escaneo sin hallazgos.
- **Riesgo 2 (Privacidad / Datos Sensibles)**: Fuga de PII (DNI, tokens, contraseñas) a través de logs de aplicación o BD de auditoría.
  - *Mitigación*: Enmascaramiento mediante `AuditMasker` (regex `password|token|secret|dni`) antes de la persistencia en `audit.audit_logs`.
- **Riesgo 3 (Acceso / Control de Acceso)**: Ataques de Fuerza Bruta en Autenticación y 2FA.
  - *Mitigación*: Rate limiting por IP/usuario en `/api/v1/auth/login` y `/api/v1/auth/verify-2fa` con bloqueo de 15 minutos tras 5 intentos fallidos (`AuthProperties`).
- **Riesgo 4 (Inmutabilidad y No Repudio)**: Alteración maliciosa o borrado de registros históricos de auditoría o evidencias periciales.
  - *Mitigación*: Triggers a nivel BD (`reject_audit_log_mutation`) que impiden `UPDATE` y `DELETE`, concatenación con encadenamiento criptográfico SHA-256 (`AuditChainService`), y sellado HMAC SHA-256 en evidencias.

---

## Archivos a Crear o Modificar

### Backend (`planillero-backend`)
- `src/main/java/ar/com/planillero/security/SecurityConfig.java`: Configuración de headers HTTP de seguridad.
- `security-log.md`: Matriz de riesgos de seguridad.
- `informe.md`: Informe final de auditoría con links y estado de verificación.

### Frontend (`planillero-frontend`)
- `security-log.md`: Documentación de seguridad cliente móvil (SecureStore, SQLCipher, permisos).

### Backoffice (`planillero-backoffice`)
- `security-log.md`: Documentación de seguridad cliente web (Guards, manejo de tokens).

---

## Supuestos y Riesgos

- **[SUPUESTO - RIESGO] Video demostrativo**: La tarea requiere la inclusión de un link a un video de ≤3 minutos demostrando el flujo de uso real. Se proveerá el guion detallado y la estructura para colocar el enlace público correspondiente.
- **[SUPUESTO] Entorno de verificación**: La base de datos PostgreSQL local para pruebas cuenta con la migración `V11__audit_log_schema.sql` aplicada para validar los triggers de inmutabilidad.
