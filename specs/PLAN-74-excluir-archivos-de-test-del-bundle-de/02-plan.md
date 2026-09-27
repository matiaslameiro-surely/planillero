# Plan técnico — PLAN-74

## Enfoque

En SDK 57 expo-router no tiene ninguna forma de excluir archivos de `src/app/` de la tabla de rutas:
su único filtro es un `require.context` sobre `*.ts`/`*.tsx` que excluye `+api` y `+html`, y el
config plugin cierra `Props` con `additionalProperties: false`, así que la opción `ignoredRouteFiles`
que propone el issue ni existe ni se puede agregar. La consecuencia es que **todo** lo que haya bajo
`src/app/` es una ruta, sin excepción, y la única forma de que un archivo de test deje de ser una ruta
es que no esté ahí.

El plan es por lo tanto el más simple posible y el que la documentación oficial recomienda: **mover
los tres archivos de test fuera del directorio de rutas** a `src/__tests__/app/`, que es la misma
convención `__tests__/` que el repo ya usa en `src/api/` y `src/components/`. No hay ningún import
relativo en esos archivos (todos usan el alias `@/`), y ese alias lo resuelve el `moduleNameMapper`
que ya está en `jest.config.js`, así que el movimiento no toca una línea de código: sólo cambia de
directorio.

Como el movimiento no deja ninguna barrera que impida repetirlo —hoy ningún gate del repo lo
detecta— el plan suma un test de regresión que recorre `src/app/` y falla si vuelve a aparecer un
archivo o carpeta de test. Es lo que convierte el arreglo en algo que se sostiene solo.

## Archivos a tocar

### frontend/

| Archivo | Acción | Para qué |
|---|---|---|
| `src/app/login.test.tsx` | mover a `src/__tests__/app/login.test.tsx` | Saca del directorio de rutas la prueba de la pantalla de login (PLAN-55, PLAN-56) |
| `src/app/__tests__/agenda.test.tsx` | mover a `src/__tests__/app/agenda.test.tsx` | Saca del directorio de rutas la prueba de navegación y logout de la agenda (PLAN-54) |
| `src/app/__tests__/agendaSafeArea.test.tsx` | mover a `src/__tests__/app/agendaSafeArea.test.tsx` | Saca del directorio de rutas la prueba de safe area y tema de la agenda (PLAN-53) |
| `src/app/__tests__/` | eliminar (queda vacío) | La carpeta desaparece con el movimiento; un directorio vacío tampoco sirve |
| `src/__tests__/app/routerDirectory.test.ts` | crear | Test de regresión: falla si `src/app/` vuelve a contener un archivo o carpeta de test |

**4 archivos.** No se modifica el contenido de ningún archivo existente. No se toca `app.json`,
`jest.config.js`, `tsconfig.json`, `package.json` ni ninguna pantalla.

## Decisiones técnicas

- **Mover los tests en vez de configurar un filtro** — Se descartó `ignoredRouteFiles` en el config
  plugin porque **no existe en SDK 57** y agregarla rompe la validación del plugin (reproducido:
  `Additional property "ignoredRouteFiles" is not allowed`). Se descartó `metro.config.js` con
  `resolver.blockList` o `resolveRequest` porque esas reglas evitan que Metro *empaquete* un módulo,
  pero no evitan que expo-router lo registre como ruta: la ruta seguiría existiendo en
  `.expo/types/router.d.ts` y `getRoutesCore` seguiría intentando cargarla. Se descartó poner los tests
  en una carpeta con prefijo `_` (`src/app/_tests/`) porque en SDK 57 `stripInvisibleSegmentsFromPath`
  ya no quita segmentos `_` (el único nombre invisible por convención es `_layout`): la carpeta
  seguiría siendo una ruta.
- **`src/__tests__/app/` como destino** — Se descartó `src/app-tests/` porque invierte una carpeta que
  no existe hoy y porque el guion no es un separador idiomático acá. Se descartó extraer la lógica de
  `login.tsx` y `agenda.tsx` a hooks o componentes testeables porque es un refactor de dos pantallas
  que excede esta tarea: el bug es que el archivo está en el lugar equivocado, no que la pantalla
  esté mal diseñada. Se descartó `tests/` en la raíz porque el repo ya tiene 12 carpetas de dominio
  bajo `src/` con sus tests adentro, y `src/__tests__/app/` mantiene la convención.
- **El test de regresión lee el disco con `node:fs` en vez de importar el árbol de rutas de expo-router**
  — Se descartó usar `expo-router`'s context (`_ctx` o `getRoutesCore`) porque son módulos internos
  sin API pública y atados a la versión; el test se rompería con cada upgrade de SDK. `readdirSync`
  recursivo sobre `src/app/` es la misma pregunta que expo-router se hace, expresada en cinco líneas
  y sin dependencia de nada. Se verificó que `node:fs` y `__dirname` funcionan bajo el preset
  `jest-expo` de este repo.
- **El test de regresión cubre `__mocks__/` además de `__tests__/`** — No está en el issue, pero es
  el mismo bug con el mismo síntoma: una carpeta `__mocks__` bajo `src/app/` se convierte igual en
  rutas. Cuesta una línea en el patrón y evita tener que volver a abrir el issue.
- **Sin gate nuevo en el harness** — El test de regresión corre con `npm test`, que ya es el gate
  `tests` del frontend (aunque hoy marcado `opcional: true` en `workspace.json`). Agregar un gate
  nuevo cambiaría la política de verificación del equipo, que es de otra tarea.

## Supuestos

- **Los tres tests pasan hoy y siguen pasando después del movimiento.** No se verificó caso por caso:
  el cambio es de directorio y los imports son absolutos, pero si alguno dependiera del nombre de la
  ruta o de la resolución de `./`, el movimiento lo rompería. Riesgo bajo, comprobado leyendo los
  imports de los tres archivos.
- **`git mv` preserva el archivo como renombre en el historial.** Asumido, no verificado: sólo afecta
  cómo se lee el diff, no el resultado.
- **`.expo/types/router.d.ts` se regenera solo.** Es un artefacto generado y gitignored; los criterios
  2 y 3 de la spec se verifican regenerándolo, no editándolo.
- `RIESGO` **Expo Go sigue funcionando igual después del cambio.** No se puede verificar desde acá sin
  un dispositivo o emulador: el criterio 3 de la spec se apoya en el árbol de rutas regenerado y en el
  log del dev server, no en abrir la app. Si ese criterio resultara insufficientemente verificable en
  la práctica, habría que pedir una prueba manual en el cierre.

## Cómo se prueba

1. `npm test` — los 33 archivos de test existentes más el nuevo, todos en verde. Baseline medido antes
   del cambio: **33 archivos, 286 tests**.
2. `npx tsc --noEmit` y `npm run lint` — los tres archivos movidos siguen tipando y complying, y el
   nuevo también.
3. **El árbol de rutas sin rutas de test**: `npx expo customize` no hace falta; se verifica con el
   árbol que expo-router genera. Concreto: borrar `.expo/types/router.d.ts`, arrancar el dev server
   (`npx expo start`, unos segundos) y confirmar que el union type de `href` no contiene
   `/login.test`, `/__tests__/agenda.test` ni `/__tests__/agendaSafeArea.test`, y que
   `.expo/dev/logs/start.log` no registra `Property 'jest' doesn't exist`.
4. **El test de regresión sirve de red**: se agrega temporalmente un `src/app/__probe.test.ts` y se
   corre sólo ese test; tiene que fallar. Después se borra el archivo. Si pasara, el test no está
   protegiendo lo que dice proteger.
5. `node .agents/scripts/verificar.mjs --tarea PLAN-74` — los gates determinísticos del harness.
