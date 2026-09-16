# Refutación de hallazgo — `05-revision-backend-1.json`

## Hallazgo refutado

> **[high] El POM referencia una versión inexistente de Spring Boot** (`pom.xml:7`, confianza 0.97)
>
> La versión `4.1.1` de `spring-boot-starter-parent` no está disponible en Maven Central. Al ejecutar
> `./mvnw -B test` desde un clon limpio, Maven falla al resolver el POM padre antes de compilar o
> ejecutar los tests.

**Motor:** `codex` · **Veredicto de la revisión:** `needs-attention`

## Por qué es falso

La versión `4.1.1` **sí existe** y se publicó en Maven Central. Dos pruebas independientes:

**1. El índice de Maven Central la lista.**

```
$ curl https://repo.maven.apache.org/maven2/org/springframework/boot/spring-boot-starter-parent/maven-metadata.xml
últimas versiones: 4.0.8, 4.1.0-M1 … 4.1.0-RC1, 4.1.0, 4.1.1, 4.2.0-M1
```

**2. El build funciona con el repositorio local de Maven vacío**, que es exactamente la condición que
pedía el hallazgo:

```
$ ./mvnw -B -Dmaven.repo.local=<directorio vacío> test
[INFO] Downloading from central: https://repo.maven.apache.org/maven2/org/springframework/boot/
       spring-boot-starter-parent/4.1.1/spring-boot-starter-parent-4.1.1.pom
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

No hubo caché previa: el `Downloading from central` de esa misma línea lo demuestra.

## Causa probable del falso positivo

El motor de revisión corre en un entorno **sin acceso a red**, así que no pudo consultar Maven Central
y respondió desde su conocimiento del ecosistema, que no alcanza a Spring Boot 4.1.1 por ser reciente.

Vale la pena registrarlo porque es un modo de error que se va a repetir: un revisor sin red no puede
verificar la existencia de una versión, un paquete o una API nueva, y tiende a reportar como
inexistente lo que simplemente no conoce. **Los hallazgos sobre disponibilidad de dependencias
conviene verificarlos siempre antes de actuar.**

## Resolución

Se mantiene `4.1.1`. No se cambia código.

Nota aparte: el hallazgo apuntaba a un problema que **sí existió** y que ya estaba corregido antes de
la revisión. El `pom.xml` generado por `start.spring.io` traía `4.1.1.RELEASE` —el identificador
interno del generador, que no es la versión del artefacto— y con eso el build efectivamente fallaba
con `Non-resolvable parent POM`. Se corrigió a `4.1.1` durante la implementación.
