# Tareas — PLAN-5

## backend

- [x] `[backend]` Incorporar dependencias de Spring Data JPA, PostgreSQL, Flyway y Testcontainers en `pom.xml`
- [x] `[backend]` Configurar DataSource, HikariCP, Flyway y JPA en `application.properties`
- [x] `[backend]` Crear migración Flyway `V1__init_schema.sql` con esquemas lógicos (`core`, `visits`, `forms`, `audit`), extensión `pgcrypto` y comentarios explicativos en español
- [x] `[backend]` Implementar servicio de salud de base de datos (`DatabaseHealthService`, `DatabaseHealthResponse` y `HealthResponse`) con identificadores en inglés y comentarios en español
- [x] `[backend]` Implementar controlador canónico `HealthController` en `ar.com.planillero.health` con rutas `/health` y `/salud`
- [x] `[backend]` Eliminar controlador heredado `SaludController` y su paquete `ar.com.planillero.salud`
- [x] `[backend]` Implementar `HealthControllerTest` y crear test de integración con Testcontainers `DatabaseIntegrationTest` (eliminando el test heredado `SaludControllerTest`)
- [x] `[backend]` Actualizar `README.md` con la documentación de variables de entorno de conexión a base de datos

## Verificación

- [x] `./mvnw -B test` en verde en `backend`
- [x] `node .agents/scripts/verificar.mjs --tarea PLAN-5` en verde
- [x] Revisión independiente sin hallazgos `critical` ni `high`
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto
