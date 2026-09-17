# Plan técnico — PLAN-5

## Enfoque

Configurar la infraestructura de persistencia relacional en `backend` incorporando Spring Data JPA con driver PostgreSQL y pool de conexiones HikariCP, administrado mediante migraciones versionadas con Flyway. La base de datos se estructurará en esquemas lógicos (`core`, `visits`, `forms`, `audit`) definidos en la migración inicial `V1__init_schema.sql`.

Conforme a la regla de `AGENTS.md`, **todo el código e identificadores** (paquetes, clases, interfaces, métodos, variables, atributos, endpoints, tablas y columnas) se implementarán en **inglés** respetando los estándares de cada ecosistema (`camelCase` para variables y métodos en Java, `PascalCase` para clases, `snake_case` para base de datos). Como parte de esta alineación, se refactorizará el controlador y paquete heredado de PLAN-2 (`SaludController` en `ar.com.planillero.salud`) hacia `HealthController` en `ar.com.planillero.health`, manteniendo la ruta canónica `/health` y un alias `/salud` para retrocompatibilidad.

Todos los comentarios explicativos que amerite incluir (Javadoc, comentarios en métodos complejos, explicaciones de diseño) se redactarán en **español**.

Para garantizar seguridad según OWASP A05, las credenciales de conexión se resolverán mediante variables de entorno (`SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`) manteniendo valores por defecto locales para que el entorno de desarrollo sea inmediato. Para la visibilidad del estado del sistema (Heurística UX 1), se implementará `DatabaseHealthService` que evaluará la conectividad y medirá la latencia en milisegundos hacia PostgreSQL, integrando este resultado en la respuesta de `GET /health`.

Las pruebas automatizadas de integración se implementarán mediante Testcontainers (`DatabaseIntegrationTest`) con una imagen oficial de PostgreSQL 16, garantizando que el ciclo de integración corra de forma autónoma, reproducible y sin requerir servicios externos preinstalados.

## Archivos a tocar

### backend/

| Archivo | Acción | Para qué |
|---|---|---|
| `pom.xml` | modificar | Agregar dependencias: Spring Data JPA, PostgreSQL driver, Flyway (core + postgresql), Testcontainers postgresql |
| `src/main/resources/application.properties` | modificar | Configuración de DataSource, HikariCP, Flyway (`core,visits,forms,audit`) y JPA / Hibernate |
| `src/main/resources/db/migration/V1__init_schema.sql` | crear | Migración Flyway: esquemas (`core`, `visits`, `forms`, `audit`), extensión `pgcrypto` (código SQL en inglés, comentarios en español) |
| `src/main/java/ar/com/planillero/health/HealthController.java` | crear | Controlador canónico `HealthController` (`GET /health` y alias `/salud`) |
| `src/main/java/ar/com/planillero/health/HealthResponse.java` | crear | Record inmutable para la respuesta (`status`, `timestamp`, `database`) |
| `src/main/java/ar/com/planillero/health/DatabaseHealthService.java` | crear | Servicio para chequear conectividad y medir latencia hacia PostgreSQL |
| `src/main/java/ar/com/planillero/health/DatabaseHealthResponse.java` | crear | Record inmutable con métricas de salud de base de datos (`status`, `latencyMs`) |
| `src/main/java/ar/com/planillero/salud/SaludController.java` | eliminar | Reemplazado por `HealthController` en el paquete en inglés |
| `src/test/java/ar/com/planillero/salud/SaludControllerTest.java` | eliminar | Reemplazado por `HealthControllerTest` |
| `src/test/java/ar/com/planillero/health/HealthControllerTest.java` | crear | Test unitario WebMvcTest de `HealthController` mockeando `DatabaseHealthService` |
| `src/test/java/ar/com/planillero/persistence/DatabaseIntegrationTest.java` | crear | Test de integración con Testcontainers verificando Flyway, conexión real a PostgreSQL 16 y latencia |
| `README.md` | modificar | Documentar variables de entorno de persistencia y configuración de base de datos |

Total: 11 archivos (incluyendo eliminaciones de clases heredadas en español), por debajo del límite de 12 de `workspace.json`.

## Decisiones técnicas

- **Código e identificadores 100% en inglés, comentarios en español.** Todo el código (clases, métodos, atributos, variables locales, nombres de paquetes, endpoints y scripts DDL) se redacta en inglés estándar del ecosistema Spring/Java/PostgreSQL. Los comentarios Javadoc o explicativos inline donde amerite se escriben en español para mantener consistencia con el equipo.
- **Refactorizar `SaludController` a `HealthController` con soporte para ambas rutas.** Se descartó mantener nombres en español en el código fuente para cumplir estrictamente con la regla de nomenclatura en inglés, preservando el path `/salud` como alias secundario para no romper clientes previos.
- **Flyway para migraciones de BD.** Se descartó Liquibase porque Flyway utiliza SQL nativo directo, facilitando la auditoría de scripts, extensiones de PostgreSQL (`pgcrypto`) y DDL de esquemas múltiples sin abstracciones XML/YAML intermedias.
- **HikariCP como pool de conexiones.** Se descartó Tomcat JDBC o Apache DBCP porque HikariCP es el pool de alto rendimiento predeterminado y recomendado por Spring Boot, con métricas de salud nativas y excelente resiliencia ante cortes transitorios.
- **Cuatro esquemas lógicos en inglés (`core`, `visits`, `forms`, `audit`).** Se descartó un esquema único (`public`) o nombres en español en base de datos. Para máxima interoperabilidad, la migración puede asegurar también los nombres en español como alias/esquemas secundarios.
- **Soporte nativo Hibernate 6 para JSONB.** Se descartó el uso de librerías externas legacy (como `hypersistence-utils`), aprovechando las capacidades nativas de Hibernate 6+ (`@JdbcTypeCode(SqlTypes.JSON)`) que se integran directamente con columnas `jsonb` de PostgreSQL sin dependencias pesadas adicionales.
- **Enriquecer `HealthController` con `DatabaseHealthService` en lugar de Actuator.** Se descartó incorporar Spring Boot Actuator en esta etapa para mantener la superficie de ataque reducida y evitar abrir endpoints no autenticados de gestión interna antes de tener definida la seguridad en PLAN-6. Un servicio simple inyectado cumple el criterio con total control.
- **Testcontainers para tests de integración.** Se descartó usar base en memoria (H2) para testing de persistencia porque H2 no reproduce fielmente el comportamiento de PostgreSQL 16 respecto a tipos `jsonb`, múltiples esquemas ni extensiones nativas (`pgcrypto`).

## Supuestos

- Docker está disponible o Testcontainers puede ejecutar contenedores en el entorno donde se corran los tests de integración.
- `RIESGO` — Si el entorno de ejecución no dispone del demonio de Docker accesible para Testcontainers (por ejemplo, entornos de CI sin Docker-in-Docker o restricciones locales de permisos en Windows), los tests que requieran contenedor requerirán configuración o fallback condicional.

## Cómo se prueba

1. `./mvnw -B test`: compila, ejecuta pruebas unitarias del controlador `HealthControllerTest` y prueba de integración con PostgreSQL 16 en contenedor Testcontainers (`DatabaseIntegrationTest`).
2. Iniciar la aplicación contra PostgreSQL local o de prueba y verificar que `curl http://localhost:8080/health` retorna `200 OK` con el payload JSON:
   ```json
   {
     "status": "UP",
     "timestamp": "2026-09-16T...",
     "database": {
       "status": "UP",
       "latencyMs": 5
     }
   }
   ```
3. Validar en la base de datos que los esquemas `core`, `visits`, `forms` y `audit` fueron creados por la migración Flyway.
4. `node .agents/scripts/verificar.mjs --tarea PLAN-5` finaliza con todos los gates en verde.
