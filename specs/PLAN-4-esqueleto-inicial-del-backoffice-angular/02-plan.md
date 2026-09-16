# Plan técnico — PLAN-4

## Enfoque

Generar con `ng new` y encima replicar la estructura de carpetas de `base-frontend`, agregar ESLint
—que Angular ya no incluye por defecto— y las tres piezas propias: configuración de entornos, servicio
HTTP con sus tests, y la pantalla inicial.

Mismo criterio que en los otros dos esqueletos: dejar que la herramienta oficial configure las partes
frágiles (builder, `tsconfig`, entry point) y poner encima sólo lo nuestro.

## Archivos a tocar

### backoffice/

| Archivo | Acción | Para qué |
|---|---|---|
| `package.json`, `angular.json`, `tsconfig*.json` | crear (generado) | Configuración del proyecto |
| `eslint.config.js` | crear | ESLint; Angular ya no lo trae de fábrica |
| `src/app/environments/environment{,.prod}.ts` | crear | URL del backend por entorno |
| `src/app/core/services/salud.service.ts` | crear | Servicio HTTP contra `GET /salud` |
| `src/app/core/services/__tests__/salud.service.spec.ts` | crear | Tests del servicio |
| `src/app/core/models/salud.model.ts` | crear | Tipos de la respuesta |
| `src/app/pages/inicio/inicio.{ts,html,scss}` | crear | Pantalla inicial con los tres estados |
| `src/app/app.{ts,html,config.ts,routes.ts}` | modificar (generado) | Layout raíz, ruta inicial, `provideHttpClient` |
| `src/app/styles/_variables.scss` | crear | Tokens mínimos, como en la plantilla |
| `.gitignore`, `.gitattributes` | crear | Artefactos y finales de línea |
| `README.md` | modificar | Cómo levantar, testear y apuntar al backend |

Alrededor de **13 entradas**. Supera el límite de 12 de `workspace.json`, así que el checkpoint se
justifica por sí solo.

## Decisiones técnicas

- **Angular 22, no 21 como `base-frontend`.** Mismo criterio que con Expo: el proyecto arranca de cero
  y empezar en una versión anterior significa migrar antes de haber escrito nada. La estructura de
  carpetas que replicamos no depende de la versión. En contra: `base-frontend` está en 21, así que
  por un tiempo los dos proyectos Angular del equipo van a diferir una mayor.
- **Vitest con jsdom para tests, que es el default de Angular 22.** No es una elección: **Angular 22
  ya no genera Karma**. El builder es `@angular/build:unit-test` sobre `vitest`. Consecuencia
  concreta: **no hace falta Chrome**, y el gate que había quedado en `workspace.json`
  (`--browsers=ChromeHeadless`, que es sintaxis de Karma) **está mal y hay que corregirlo** —igual que
  el requisito de Chrome que agregué al README del harness.
- **ESLint agregado a mano con `@angular-eslint`.** `ng new` ya no lo incluye. Sin esto el script
  `lint` no existiría y el gate se saltearía en silencio, que es exactamente el problema que tuvimos
  con el lint del frontend.
- **Entornos con `fileReplacements`**, como `base-frontend`: un archivo por entorno en
  `src/app/environments/` y el reemplazo declarado en `angular.json`. Es la convención que el equipo ya
  usa; no hay razón para inventar otra.
- **Servicio con `HttpClient` y `provideHttpClient()`**, no `fetch`. Acá sí conviene el cliente del
  framework: es lo que permite usar interceptors cuando llegue la autenticación, y es lo que hace la
  plantilla del equipo. (En el móvil elegimos `fetch` porque no había framework que aportara nada.)
- **Estructura de carpetas de `base-frontend`**: `core/{guards,interceptors,models,services}`,
  `shared/`, `pages/`, `environments/`, `styles/`. Los specs de `core/` van en un subdirectorio
  `__tests__/` al lado del archivo, como en la plantilla.

## Supuestos

- Angular CLI 22 y npm accesibles — **verificado**: CLI 22.1.8, y sus `engines` aceptan Node 24.15.0,
  que es el instalado.
- `ng new` de Angular 22 genera Vitest y no Karma — **verificado** generando un proyecto de prueba e
  inspeccionando `angular.json`.
- El repo `planillero-backoffice` sólo tiene el `README.md` del commit inicial — **verificado**.
- `RIESGO` — el backend no tiene autenticación y el backoffice va a necesitarla. Este esqueleto queda
  sin auth a propósito; hasta que exista, el backoffice no puede pasar de pantallas públicas. Es una
  dependencia real que conviene tener presente al planificar lo que sigue.
- `RIESGO` — Node 24.15.0 satisface el rango de Angular (`^24.15.0`) **justo en el borde inferior**.
  Cualquier máquina del equipo con un Node 24 anterior, o con Node 23, no va a poder construir el
  proyecto. Se documenta el requisito en el README.

## Cómo se prueba

1. `cd backoffice && npm ci && npm run lint && npm run build && npm test` — los cuatro en verde.
2. `node .agents/scripts/verificar.mjs --tarea PLAN-4` corre los tres gates.
3. Prueba negativa en los dos gates: romper la ruta del servicio pone los tests en rojo; introducir un
   warning pone el lint en rojo.
4. Prueba de contrato contra el backend de PLAN-2 levantado en local: su respuesta cumple lo que el
   servicio espera para dar «conectado».
