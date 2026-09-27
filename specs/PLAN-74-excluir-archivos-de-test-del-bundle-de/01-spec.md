# PLAN-74 — Excluir archivos de test del bundle de Expo Router

## Contexto y problema

Expo Router trata **todo** lo que hay dentro de `src/app/` como una ruta. No hay excepción para los
archivos de test: `src/app/login.test.tsx` se convierte en la ruta `/login.test` y
`src/app/__tests__/agenda.test.tsx` en `/__tests__/agenda.test`. Como ninguno exporta un componente
por default, expo-router los marca como rutas inválidas y los **carga igual** al armar el árbol de
rutas.

El síntoma está registrado en el log del dev server (`.expo/dev/logs/start.log`): al abrir la app
salta `ReferenceError: Property 'jest' doesn't exist` con stack en `src\app\login.test.tsx:9:20`, y el
`ReferenceError` aborta el bundle completo. Los tipos generados por `typedRoutes` confirman que las
tres rutas de test existen: `.expo/types/router.d.ts` incluye `/login.test`,
`/__tests__/agenda.test` y `/__tests__/agendaSafeArea.test` en el union type de `href`.

Además, el bundle arrastra código de test en producción: con `asyncRoutes: false` todas las rutas se
cargan eager, y el aviso de «falta el export default» es sólo `console.warn` en desarrollo.

**El issue propone una solución que no existe en la versión del proyecto.** Dice de configurar
`ignoredRouteFiles` en el plugin `expo-router` dentro de `app.json`. Se verificó contra lo instalado
y esa opción no es válida:

- `expo` ~57.0.23, `expo-router` ~57.0.21. La cadena `ignoredRouteFiles` no aparece **ninguna vez** en
  todo `node_modules` (búsqueda sobre `.js`/`.ts`/`.json`).
- El schema del config plugin (`node_modules/expo-router/plugin/options.json`) cierra `Props` con
  `"additionalProperties": false`, y `node_modules/expo-router/plugin/build/withRouter.js:33` valida
  las props contra ese schema. Agregarla **rompe el build**, no lo arregla. Reproducido:

  ```
  $ node -e "const s=require('@expo/schema-utils');const schema=require('./node_modules/expo-router/plugin/options.json');
             try{s.validate(schema,{ignoredRouteFiles:['**/*.test.*']});console.log('VALID')}
             catch(e){console.log('INVALID:',e.message)}"
  INVALID: Invalid options object. expo-router config plugin options options object does not match the defined schema.
   - options.ignoredRouteFiles (additionalProperties): Additional property "ignoredRouteFiles" is not allowed
  ```

- La documentación oficial de expo-router es explícita: *«do not put your test files inside the app
  directory. All files inside your app directory must be either routes or layout files. Instead, use
  the tests directory or a separate directory»*. El único filtro que expo-router aplica es
  `require.context` sobre `*.ts`/`*.tsx` excluyendo `+api` y `+html`
  (`node_modules/expo-router/_ctx.js`): no hay patrón de test, ni por nombre ni por carpeta.

Por eso hace falta una decisión antes de seguir: **dónde quedan los tests**.

## Alcance

**Repos que toca:** `frontend`

## Criterios de aceptación

1. Bajo `src/app/` no queda ningún archivo que matchee `*.test.ts`, `*.test.tsx`, `*.spec.ts`,
   `*.spec.tsx`, ni ninguna carpeta `__tests__/`.
2. Al regenerar los tipos de expo-router (`.expo/types/router.d.ts`), el union type de `href` no
   contiene ninguna ruta cuyo nombre venga de un archivo de test. En particular, desaparecen
   `/login.test`, `/__tests__/agenda.test` y `/__tests__/agendaSafeArea.test`.
3. Al abrir la app (Expo Go o dev server) no aparece `ReferenceError: Property 'jest' doesn't exist`
   ni el warn `missing the required default export` referido a un archivo de test.
4. Los tres tests de las pantallas de login y agenda **siguen existiendo y siguen pasando**, con la
   misma cantidad de casos que antes (sin perder ni agregar cobertura por el movimiento).
5. El conjunto completo de tests del repo sigue pasando: los 33 archivos de test de `src/`, sin
   tests saltados (`--passWithNoTests` no, `skip` no).
6. `npm run lint` y `npx tsc --noEmit` pasan sin errores.
7. Los tipos de las rutas siguen funcionando: `router.push('/login')`, `router.push('/agenda')` y
   `router.push('/evidence/[visitId]', …)` siguen compilando con `typedRoutes: true`.
8. Existe un test de regresión que falla si alguien deja un archivo `*.test.*`, `*.spec.*`, o una
   carpeta `__tests__/` o `__mocks__/` dentro de `src/app/`, y ese test está activo (no `skip`, no
   `only`).
9. El archivo `src/app/__tests__/` deja de existir, y con él ningún directorio vacío bajo `src/app/`.

## Fuera de alcance

- **No** cambiar la versión de `expo` ni de `expo-router`, ni hacer upgrade a SDK 58.
- **No** agregar `ignoredRouteFiles` (ni en `app.json`, ni en `app.config.*`, ni en `metro.config.js`):
  no es una opción válida en esta versión y rompería la validación del config plugin.
- **No** tocar `jest.config.js`. Tiene un comentario explícito del equipo (líneas 4-6) prohibiendo
  acotar `roots` o reescribir `transformIgnorePatterns` porque deja al runtime de Expo fuera del
  alcance de módulos de jest.
- **No** mover ni renombrar las pantallas (`login.tsx`, `agenda.tsx`, `formulario.tsx`, `index.tsx`,
  `_layout.tsx`, `evidence/[visitId].tsx`): sus rutas no cambian.
- **No** agregar un gate de verificación nuevo en el harness ni cambiar `workspace.json`.
- **No** resolver PLAN-66 (la versión web de Expo no compila por el `.wasm` de expo-sqlite), que es
  una tarea aparte del sprint.

## Preguntas abiertas

Resueltas el 2026-09-27; ambas quedaron asentadas en el issue PLAN-74.

- [x] **`BLOQUEANTE`** — *¿Cuál es el destino de los 3 archivos de test?* → **`src/__tests__/app/`**.
  Se descartó `src/app-tests/` porque invierte una carpeta que no existe hoy, y se descartó extraer
  la lógica de las pantallas porque es un refactor de `login.tsx` y `agenda.tsx` que cambia el
  alcance de la tarea. `src/__tests__/app/` sigue la convención `__tests__/` que el repo ya usa en
  `src/api/` y `src/components/`, y los imports `@/app/...` siguen resolviendo por el
  `moduleNameMapper` que ya existe en `jest.config.js`.
- [x] **`NO-BLOQUEANTE`** — *¿Se agrega un test de regresión?* → **Sí.** Recorre `src/app/` y falla si
  encuentra un archivo de test o una carpeta `__tests__/`. Es la única red disponible: el gate `tests`
  es opcional y ni `lint` ni `tsc` detectan el problema.
