# PLAN-2 — Esqueleto inicial del backend (Spring Boot)

## Contexto y problema

El repositorio `planillero-backend` está vacío: sólo tiene el README del primer commit. Sin un
proyecto, ninguna tarea de backend puede empezar, y los gates de verificación del harness no tienen
nada que compilar ni testear.

Hace falta el esqueleto mínimo de una aplicación Spring Boot que levante, que se pueda construir sin
depender de que cada desarrollador tenga Maven instalado, y que exponga algo verificable para
confirmar que la aplicación realmente arranca.

Es además la primera tarea que atraviesa el harness completo, así que su valor secundario es mostrar
si el ciclo cierra de punta a punta.

## Alcance

**Repos que toca:** `backend`

## Criterios de aceptación

1. `./mvnw -B test` termina en verde desde un clon limpio, sin Maven instalado en la máquina.
2. La aplicación levanta con Java 21 y responde `GET /salud` con estado 200 y un cuerpo JSON que
   incluye el estado de la aplicación.
3. Existe al menos un test automatizado que verifica ese endpoint y que falla si el endpoint deja de
   responder.
4. `node .agents/scripts/verificar.mjs --tarea PLAN-2` detecta Maven y corre los gates en verde.
5. El repo tiene `.gitignore` para artefactos de build y `.gitattributes` que preserva `mvnw` con
   finales de línea LF.

## Fuera de alcance

- Base de datos, persistencia y migraciones.
- Autenticación y autorización.
- Cualquier endpoint de negocio de planillas.
- Configuración de despliegue o CI.

## Preguntas abiertas

Ninguna. Las decisiones técnicas abiertas (gestor de build, versión de Spring Boot, dependencias
iniciales, nombre del paquete) se resuelven en el plan y se aprueban en su checkpoint.
