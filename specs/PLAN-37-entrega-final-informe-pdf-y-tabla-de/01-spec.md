# PLAN-37 — Entrega final: informe PDF (Parte 1, secciones 1 a 7) y tabla de links

## Contexto y problema

La consigna del Trabajo de Fin de Ciclo del *Curso de Inteligencia Artificial para Programadores* (Universidad Tecnológica Nacional · FRBA), detallada en `docs/Entrega final curso.pdf`, exige la presentación de un informe final de la Parte 1 que sirva como índice y evidencia de la aplicación real, funcional y demostrable construida durante el trayecto formativo.

El informe debe comenzar obligatoriamente con una tabla de links de acceso directo a los recursos del proyecto (repositorio de código, aplicación web en producción, APK/recursos) y desarrollar siete secciones fundamentales:
1. Presentación del equipo y del proyecto.
2. Arquitectura técnica (diagrama general y UML).
3. Stack tecnológico con justificación de elecciones.
4. Evidencia de funcionamiento (capturas, flujo principal, log de sesión real).
5. Evaluación UX/UI (heurísticas de Nielsen y público objetivo).
6. Evaluación de Ciberseguridad (log de riesgos y medidas adoptadas).
7. IAs usadas en el co-work de desarrollo (herramientas, resultados y reflexión crítica).

El usuario definió que el documento se consolidará en formato Markdown maestro (`docs/INFORME_FINAL_ENTREGA.md`), documentando la modalidad de trabajo cruzado del equipo, explicitando que el componente de IA dentro de la app quedó en fase Post-MVP priorizando el co-work agéntico como eje principal de IA aplicada, y postergando el video demostrativo fuera de esta entrega.

## Alcance

**Repos que toca:** `harness`

- Generación del documento maestro en Markdown: `docs/INFORME_FINAL_ENTREGA.md`.
- Consolidación y estructuración de datos provenientes de entregas previas (`docs/Resolucion_Practico_App_Planillero.pdf`, `docs/resolucion_planillero_texto.txt`), auditorías UX (`frontend/docs/AUDITORIA_UX_MOVIL.md`, `backoffice/docs/auditoria-ux-ui.md`), seguridad (`*/security-log.md`), registros E2E (`frontend/docs/REGISTRO_E2E.md`) y métricas cuantitativas del harness (`.agents/scripts/informe.mjs`).

## Criterios de aceptación

1. **Tabla de links obligatoria (primera página):** Contiene enlaces a los repositorios de GitHub (aclarando requisito de visibilidad pública según PLAN-1), a la aplicación web en producción desplegada bajo Hostinger VPS con Traefik (`https://planillero.ferchamorro.cloud`) con credenciales de prueba, y estado del APK y recursos.
2. **Sección 1 (Equipo y proyecto):** Presenta a los cuatro integrantes (Federico Moron, José Fernando Chamorro Goncalves, Juan Ignacio Urrutia y Matías Lameiro) bajo la modalidad acordada de trabajo cruzado/interdisciplinario en todos los frentes. Redacta el problema funcional y el público objetivo con precisión.
3. **Sección 2 (Arquitectura técnica):** Incluye diagrama de flujo de datos general, ubicación de la memoria persistente (PostgreSQL, volumen de evidencias, SQLite local), discriminación entre lógica tradicional y módulos futuros de IA, y diagramas UML (casos de uso y secuencia/clases).
4. **Sección 3 (Stack tecnológico):** Presenta la tabla completa con el stack adoptado (Spring Boot 4 / Java 21, React Native + Expo, Angular 22, PostgreSQL 16 + JSONB, SQLite, Docker, Traefik) con la justificación técnica de cada elección frente a alternativas descartadas.
5. **Sección 4 (Evidencia de funcionamiento):** Define los bloques y guías para capturas (Home, flujo principal de visita, evidencia/auditoría) y un log de sesión real estructurado obtenido de las pruebas E2E. Explicita con honestidad la decisión de cátedra que situó el módulo de IA en la app (PLAN-21) como Post-MVP, redirigiendo el foco hacia el co-work agéntico.
6. **Sección 5 (Evaluación UX/UI):** Autoevaluación exhaustiva de 5 heurísticas de Nielsen en móvil y web basada en las auditorías de PLAN-16 y PLAN-18. Incluye respuestas sobre nivel técnico del usuario y explicita que el protocolo de campo T1-T6 quedó diseñado y documentado formalmente pendiente de ejecución física en terreno (PLAN-34).
7. **Sección 6 (Ciberseguridad):** Matriz de ciberseguridad con al menos 4 riesgos identificados (OWASP, inyección de prompt/integridad de datos, protección de secretos y control de acceso RBAC) con sus respectivas medidas implementadas.
8. **Sección 7 (IAs en co-work):** Tabla de herramientas de IA utilizadas (Claude Code, Antigravity, OpenCode, Codex), métricas objetivas del ciclo SDD (70 tareas, 68 cerradas, revisión independiente, detección de bloqueantes) y el párrafo de reflexión crítica obligatoria.

## Fuera de alcance

- Grabación o edición del video de demostración de 3 minutos (PLAN-32).
- Modificaciones de código en `backend`, `frontend` o `backoffice`.
- Compilación a formato binario PDF (el entregable es el documento Markdown listo para renderizar/imprimir).
- Preguntas de la Parte 2 (IA local en tu proyecto), que corresponden a una instancia o tarea complementaria.

## Preguntas abiertas

Ninguna. (Fueron respondidas y consensuadas con el usuario en la fase de preparación).
