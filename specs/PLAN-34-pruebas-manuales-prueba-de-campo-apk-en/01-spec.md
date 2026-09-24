# PLAN-34 — Pruebas manuales: prueba de campo, APK en tablet y recorrido E2E

## Contexto y problema

Al cierre del Sprint 4 quedaron pendientes pruebas hechas por personas. Hasta ahora cada tarea se
verificó con tests automáticos y gates, pero nadie usó la aplicación de punta a punta. El objetivo
del Sprint 4 incluía «pruebas E2E» y se difirieron a esta tarea.

Son tres entregas:

1. **Prueba de campo** (viene de PLAN-16): la §5 de `frontend/docs/AUDITORIA_UX_MOVIL.md` documenta
   una prueba con un operador real que **no se hizo**. Hoy §5 y la conclusión 4 figuran como hechas
   con datos ficticios (100% de éxito, SUS 92.5, testimonio de un "Inspector Técnico de Campo").
2. **APK instalado en una tablet** (viene de PLAN-15): el `docker/Dockerfile.apk` habilita HTTP
   (useless para el compose local sin TLS) y el build lo confirma, pero nunca se probó en un
   dispositivo real.
3. **Recorrido E2E**: nadie recorrió el ciclo completo de la aplicación con el entorno levantado.

**Decisión tomada con el usuario:** dado que una prueba de campo real requiere una persona y una
tablet (fuera de lo que puede ejecutar la IA), se toma el camino alternativo que el propio criterio
de aceptación 1 explícitamente permite: **reescribir §5 y la conclusión 4 como «protocolo pendiente
de ejecución»**, dejando el protocolo T1–T6 listo para ejecutarse. El recorrido E2E se hace de forma
automática contra el stack levantado y se documenta.

## Alcance

**Repos que toca:** `frontend`

> La prueba de campo se resuelve cambiando un documento del repo `frontend` (`docs/AUDITORIA_UX_MOVIL.md`).
> El APK se construye con las herramientas de `frontend` y el recorrido E2E se ejecuta contra el stack
> compuesto (backend via Docker) pero sin cambiar código: el backend se usa tal cual está en su rama base.

## Criterios de aceptación

1. La §5 del informe UX móvil y la conclusión 4 reflejan que la prueba de campo está **pendiente de
   ejecución**, con el protocolo T1–T6 detallado y lista de datos (ficha técnica) a completar, sin
   resultados fabricados.
2. El APK se genera correctamente con `scripts/build-apk.sh` contra la IP de la máquina y hace login
   contra el backend levantado (verificado con el emulador/dispositivo disponible; si no hay
   dispositivo, se documenta el build exitoso y el estado del intento).
3. Hay un registro del recorrido E2E con los problemas encontrados; los que sean bugs se cargan en
   Jira como tareas separadas.

## Fuera de alcance

- La ejecución efectiva de la prueba de campo con un operador real (requiere persona y tablet física;
  queda documentada como pendiente).
- Correcciones de bugs que aparezcan en el recorrido E2E: se cargan como issues separados en Jira.
- El video demostrativo (va por separado en PLAN-32).
- Cambios de código en backend o backoffice.

## Preguntas abiertas

- [ ] `NO-BLOQUEANTE` — ¿Dónde vive el registro del recorrido E2E? Se propone `frontend/docs/REGISTRO_E2E.md` para que quede versionado con el repo, versionarlo en la misma rama.