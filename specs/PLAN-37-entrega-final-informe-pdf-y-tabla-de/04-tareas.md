# Tareas — PLAN-37

Checklist en orden de dependencia para la elaboración y verificación del informe final.

## harness

- [x] `[harness]` Redactar encabezado y Tabla de Links obligatoria (GitHub, Web Hostinger, APK, notas de video).
- [x] `[harness]` Redactar Sección 1: Presentación del equipo (trabajo cruzado de los 4 integrantes), problema y público objetivo.
- [x] `[harness]` Redactar Sección 2: Arquitectura técnica (diagrama de flujo general de datos, persistencia, componentes tradicionales vs IA y diagrama UML de casos de uso/secuencia).
- [x] `[harness]` Redactar Sección 3: Stack tecnológico con tabla comparativa de justificación de elecciones técnicas.
- [x] `[harness]` Redactar Sección 4: Evidencia de funcionamiento (estructura para capturas de Home/flujo/auditoría, log de sesión real E2E y fundamentación de IA en el co-work con módulo PLAN-21 Post-MVP).
- [x] `[harness]` Redactar Sección 5: Evaluación UX/UI con autoevaluación de 5 heurísticas de Nielsen en móvil y web, y estado del protocolo T1-T6 (PLAN-34).
- [x] `[harness]` Redactar Sección 6: Evaluación de Ciberseguridad con matriz de al menos 4 riesgos mitigados (OWASP, inyección de prompt/integridad, secretos y autenticación RBAC).
- [x] `[harness]` Redactar Sección 7: IAs usadas en el co-work con tabla métrica de herramientas del harness y párrafo de reflexión crítica obligatoria.

## Verificación

- [x] Gates en verde en los repos del alcance (`node .agents/scripts/verificar.mjs --tarea PLAN-37`).
- [x] Revisión independiente con motor configurado (`node .agents/scripts/revisar.mjs --tarea PLAN-37 --repo harness`).
- [x] Cobertura completa de los 8 criterios de aceptación de `01-spec.md`.
