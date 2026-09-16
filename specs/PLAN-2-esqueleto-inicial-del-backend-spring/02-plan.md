# Plan técnico — PLAN-2

## Enfoque

Generar el proyecto con la API de `start.spring.io` en vez de escribir los archivos a mano. Eso trae
el wrapper de Maven (`mvnw`), el `pom.xml` con las versiones consistentes entre sí y la estructura de
carpetas estándar, que son justamente las partes donde un esqueleto hecho a mano se equivoca en
silencio. Encima de lo generado se agrega el endpoint de salud, su test, y los archivos de
configuración de git.

## Archivos a tocar

### backend/

| Archivo | Acción | Para qué |
|---|---|---|
| `pom.xml` | crear (generado) | Dependencias y versión de Java |
| `mvnw`, `mvnw.cmd`, `.mvn/wrapper/` | crear (generado) | Construir sin Maven instalado |
| `src/main/java/ar/com/planillero/PlanilleroApplication.java` | crear (generado) | Punto de entrada |
| `src/main/java/ar/com/planillero/salud/SaludController.java` | crear | Endpoint `GET /salud` |
| `src/test/java/ar/com/planillero/salud/SaludControllerTest.java` | crear | Test del endpoint |
| `src/main/resources/application.properties` | crear (generado) | Configuración base |
| `.gitignore` | crear | `target/`, artefactos de build, archivos de IDE |
| `.gitattributes` | crear | `mvnw` con LF; sin esto se rompe en Linux y macOS |
| `README.md` | modificar | Cómo levantar y testear el proyecto |

Total: 9 entradas, por debajo del límite de 12 de `workspace.json`.

## Decisiones técnicas

- **Maven, no Gradle.** Se descartó Gradle porque `workspace.json` ya define los gates para ambos
  pero Maven es el default de Spring Boot y su wrapper es el más predecible en Windows. Cambiarlo
  después es rehacer el esqueleto, así que conviene decidirlo ahora.
- **Spring Boot 4.1.1, la versión estable por defecto.** No se descartó 3.x por preferencia: el
  generador **ya no ofrece ninguna versión 3.x**, así que 4.x es lo único disponible. Vale saberlo
  porque alguna librería de terceros puede tardar en soportar 4.x.
- **Java 21.** Es el que declara `workspace.json` y el que quedó instalado (Temurin 21). El generador
  también ofrece 25 y 26; quedarse en la LTS que ya está configurada evita desalinear el harness.
- **Endpoint `/salud` propio, no Spring Boot Actuator.** Se descartó Actuator porque para un
  esqueleto agrega superficie expuesta y configuración de seguridad que todavía no queremos decidir.
  Un controller de cinco líneas cumple el criterio de aceptación y no compromete nada a futuro.
- **Paquete `ar.com.planillero`.** Dominio invertido por producto, sin nombre de empresa: el proyecto
  no nombra a la empresa en el código (ver AGENTS.md).
- **Dependencia única: Spring Web.** Sin base de datos ni seguridad, que están fuera de alcance.

## Supuestos

- `start.spring.io` sigue accesible desde esta máquina — **verificado** antes de escribir el plan
  (responde 200 y ofrece Boot 4.1.1 con Java 21 y Maven).
- El repo `planillero-backend` sólo tiene el `README.md` del commit inicial, así que nada de lo
  generado pisa trabajo existente — **verificado**.
- `RIESGO` — Spring Boot 4.x es reciente. Si el proyecto necesitara una librería que todavía no lo
  soporta, habría que bajar a 3.x generando el esqueleto por otra vía, porque el generador ya no la
  ofrece. Para un esqueleto sin dependencias de terceros el riesgo es bajo, pero la decisión queda
  tomada para todo el proyecto.

## Cómo se prueba

1. `cd backend && ./mvnw -B test` desde un clon limpio: compila y corre el test del endpoint.
2. `./mvnw spring-boot:run` y `curl http://localhost:8080/salud` devuelve 200 con JSON.
3. `node .agents/scripts/verificar.mjs --tarea PLAN-2` detecta Maven y corre los gates en verde.
4. El test se rompe a propósito (cambiando la ruta del controller) y el gate pasa a rojo: confirma
   que el test verifica algo real y no siempre pasa.
