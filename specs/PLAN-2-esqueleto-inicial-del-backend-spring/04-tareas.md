# Tareas — PLAN-2

## backend

- [ ] `[backend]` Generar el proyecto con `start.spring.io` (Maven, Boot 4.1.1, Java 21, dependencia `web`)
- [ ] `[backend]` Verificar que el wrapper `mvnw` quedó con permisos y finales de línea correctos
- [ ] `[backend]` Agregar `.gitattributes` (`mvnw` con LF) y `.gitignore` (`target/`, IDE)
- [ ] `[backend]` Implementar `SaludController` con `GET /salud`
- [ ] `[backend]` Implementar `SaludControllerTest` que verifique estado 200 y cuerpo
- [ ] `[backend]` Actualizar el `README.md` con cómo levantar y testear

## Verificación

- [ ] `./mvnw -B test` en verde desde un clon limpio
- [ ] Prueba negativa: romper la ruta del endpoint hace fallar el test
- [ ] `node .agents/scripts/verificar.mjs --tarea PLAN-2` en verde
- [ ] Revisión independiente sin hallazgos `critical` ni `high`
- [ ] Los 5 criterios de aceptación de `01-spec.md` quedan cubiertos
