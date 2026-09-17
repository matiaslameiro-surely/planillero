# PLAN-5 — TASK-01: Infraestructura de Persistencia PostgreSQL y Conexión Backend

## Contexto y problema

El repositorio `planillero-backend` cuenta únicamente con un esqueleto web inicial que expone un endpoint básico sin persistencia ni acceso a datos. Ninguna de las funcionalidades de negocio del sistema (gestión de visitas, planillas dinámicas, auditoría, asignación de rutas) puede persistirse sin una infraestructura de base de datos relacional sólida.

Se requiere establecer la infraestructura de persistencia institucional utilizando PostgreSQL 16, administrada de forma determinística y reproducible mediante migraciones con Flyway. La arquitectura de datos debe organizar las tablas en esquemas lógicos (`core`, `visits`, `forms`, `audit`) para separar responsabilidades y facilitar futuras políticas de seguridad y escalabilidad.

Asimismo, la capa de backend en Spring Boot debe configurarse con Spring Data JPA y un pool de conexiones resiliente (HikariCP), con soporte para transaccionalidad y tipos estructurados JSONB (necesarios para la definición de esquemas de formularios dinámicos).

Conforme a las convenciones de `AGENTS.md`, **todo el código** (paquetes, clases, interfaces, métodos, variables, atributos, tablas y columnas) se escribe en **inglés** respetando los estándares de cada tecnología (`camelCase` en Java/TypeScript, `PascalCase` para clases, `snake_case` en SQL/PostgreSQL). Todo lo que amerite explicación o documentación de diseño (comentarios de código, Javadoc, notas conceptuales) se escribe en **español**.

Para satisfacer la visibilidad del estado del sistema (Heurística 1 de UX) y las directivas de seguridad OWASP A05, el estado y latencia de la base de datos deben reflejarse en el endpoint de salud (`GET /health`, manteniendo alias `/salud` por compatibilidad), y la parametrización de conexión debe resolverse por variables de entorno sin exponer secretos. La infraestructura debe validarse mediante pruebas de integración automatizadas con Testcontainers.

## Alcance

**Repos que toca:** `backend`

## Criterios de aceptación

1. **Gestión de dependencias de persistencia:**
   El archivo `pom.xml` incorpora las dependencias requeridas en inglés: Spring Data JPA (`spring-boot-starter-data-jpa`), driver JDBC de PostgreSQL (`postgresql`), Flyway (`flyway-core` y `flyway-database-postgresql`), soporte para tipos JSONB con Hibernate 6, y dependencias de test de integración con Testcontainers (`testcontainers:postgresql`, `spring-boot-testcontainers`).
2. **Esquemas lógicos y migración Flyway inicial:**
   - Se crea la migración inicial `V1__init_schema.sql` en `src/main/resources/db/migration/`.
   - La migración crea y garantiza la existencia de los esquemas lógicos en inglés: `core`, `visits`, `forms`, `audit` (y opcionalmente esquemas sinónimos `visitas`, `formularios`, `auditoria` si son requeridos para compatibilidad).
   - La migración habilita la extensión `pgcrypto` para generación de identificadores UUID.
   - Los identificadores SQL (esquemas, tablas, columnas, restricciones) siguen `snake_case` en inglés, con comentarios explicativos SQL (`-- ...`) en español.
   - Flyway se ejecuta automáticamente durante el arranque de la aplicación backend.
3. **Configuración resiliente y segura de conexión (HikariCP & OWASP A05):**
   - La conexión a la base de datos se configura en `application.properties` a través de variables de entorno (`SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`) con valores por defecto orientados a desarrollo local.
   - No se almacenan credenciales sensibles de producción en el repositorio.
   - El pool de conexiones HikariCP está configurado con parámetros de resiliencia (tamaño máximo del pool, tamaño mínimo inactivo, timeout de conexión y validación de conexiones vivas).
4. **Endpoint de salud con disponibilidad y latencia (Heurística UX 1):**
   - El endpoint `HealthController` expone `GET /health` (con soporte para `/salud`), evalúa la conectividad con la base de datos mediante `DatabaseHealthService` y calcula la latencia en milisegundos.
   - El payload JSON utiliza claves y valores en inglés (`status`, `timestamp`, `database: { status: "UP", latencyMs: ... }`).
5. **Convenciones de nombres y código en inglés:**
   - El paquete legado `ar.com.planillero.salud` y la clase `SaludController` se refactorizan al paquete idiomático en inglés `ar.com.planillero.health` con la clase `HealthController`.
   - Todos los identificadores (nombres de clases, interfaces, métodos, variables, atributos y tests) están en inglés (`HealthResponse`, `DatabaseHealthService`, `DatabaseHealthResponse`, `DatabaseIntegrationTest`, etc.).
   - Los comentarios Javadoc y de código se redactan en español explicando el propósito y decisiones de diseño donde amerite.
6. **Soporte de mapeo JSONB:**
   - La configuración de JPA/Hibernate permite la persistencia y lectura de columnas de tipo nativo `jsonb` en PostgreSQL utilizando las capacidades estándar de Hibernate 6 (`@JdbcTypeCode(SqlTypes.JSON)`).
7. **Tests de integración con Testcontainers:**
   - Existe al menos un test de integración (`DatabaseIntegrationTest`) con `@SpringBootTest` que utiliza un contenedor Docker de PostgreSQL 16 (vía Testcontainers) para verificar que la aplicación levanta el contexto, Flyway ejecuta la migración inicial satisfactoriamente y la base de datos responde.
8. **Verificación y gates en verde:**
   - `./mvnw -B test` ejecuta y aprueba todos los tests unitarios y de integración.
   - El comando del harness `node .agents/scripts/verificar.mjs --tarea PLAN-5` finaliza en verde.

## Fuera de alcance

- Definición de entidades de negocio y tablas de dominio específicas (visitas, planillas, plantillas, formularios de campo); estas se implementarán en sus respectivas tareas de negocio (por ejemplo, PLAN-7).
- Lógica de autenticación centralizada, tokens JWT y control de acceso RBAC (asignados a PLAN-6 / TASK-03).
- Cualquier cambio o integración en las aplicaciones cliente (`frontend` móvil y `backoffice` web).
- Provisionamiento de infraestructura de nube o clusters administrados de base de datos.

## Preguntas abiertas

Ninguna.
