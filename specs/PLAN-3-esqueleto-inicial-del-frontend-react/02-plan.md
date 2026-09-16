# Plan técnico — PLAN-3

## Enfoque

Generar el proyecto con `create-expo-app` y después **quitar** el boilerplate de ejemplo que trae la
plantilla, en lugar de armar la estructura a mano. La plantilla configura bien las partes frágiles
—el punto de entrada, el plugin de `expo-router`, el `tsconfig` con los alias, el `babel.config`— que
son justamente donde un esqueleto artesanal falla de formas difíciles de diagnosticar. Limpiar
ejemplos es más barato y más seguro que configurar Expo desde cero.

Encima de eso van las tres piezas propias: la pantalla inicial, el cliente HTTP con su configuración
por entorno, y los tests.

## Archivos a tocar

### frontend/

| Archivo | Acción | Para qué |
|---|---|---|
| `package.json`, `app.json`, `tsconfig.json`, `babel.config.js`, `eslint.config.js` | crear (generado) | Configuración del proyecto |
| `app/_layout.tsx` | modificar (generado) | Layout raíz, sin el tema de ejemplo |
| `app/index.tsx` | crear | Pantalla inicial que muestra el estado de conexión |
| `src/api/cliente.ts` | crear | Cliente HTTP y función `obtenerSalud()` |
| `src/api/cliente.test.ts` | crear | Tests del cliente: respuesta correcta y fallo de red |
| `src/constants/env.ts` | crear | Lectura única de las variables de entorno |
| `.env.example` | crear | Documenta las variables sin valores reales |
| `jest.config.js` | crear | Preset `jest-expo` y script `npm test` |
| `.gitignore`, `.gitattributes` | crear | Artefactos, `node_modules`, `.env`; finales de línea |
| `README.md` | modificar | Cómo levantar, testear y apuntar al backend |
| *(a eliminar)* `components/`, `constants/` y pantallas de ejemplo de la plantilla | eliminar | Boilerplate que no usamos |

Alrededor de **11 entradas propias** más lo generado. Está en el límite de 12 de `workspace.json`,
así que el checkpoint se justifica por sí solo.

## Decisiones técnicas

- **Expo SDK 57 (la versión actual), no 54 como `panic-mobile-frontend`.** Es la decisión más
  discutible del plan y por eso va primero. A favor de 57: el proyecto arranca de cero y empezar en
  un SDK viejo significa migrar antes de haber escrito nada. A favor de 54: es lo que el equipo ya
  conoce y lo que asumen las skills de Expo que hay en el otro repo. **Recomiendo 57**, pero si
  preferís que los dos proyectos móviles vayan juntos, se cambia acá y no después.
- **`expo-router` para navegación.** Se descartó React Navigation directo porque el equipo ya usa
  `expo-router` en el otro proyecto y es el default de Expo. Alinear acá no cuesta nada.
- **`fetch` nativo, no `axios`.** Se descartó `axios` —que sí usa el otro proyecto— porque para un
  `GET` no aporta nada y agrega una dependencia. Los interceptors de `axios` se van a necesitar
  recién cuando haya autenticación; ese es el momento de incorporarlo, no ahora. El cliente queda
  detrás de una función propia, así que cambiarlo después toca un solo archivo.
- **`jest-expo` para tests.** Es el preset oficial y el que entiende las transformaciones de React
  Native. Sin esto, `npm test` no existiría y el gate de tests se saltearía para siempre.
- **TypeScript en modo estricto y alias `@/`**, igual que el otro proyecto. No hay razón para
  divergir en algo que ya está decidido.
- **La URL del backend por `EXPO_PUBLIC_API_URL`.** El prefijo `EXPO_PUBLIC_` es lo que hace que la
  variable llegue al bundle. Se lee en un solo módulo (`src/constants/env.ts`) y no dispersa
  `process.env` por el código, que es la convención del otro repo.

## Supuestos

- `create-expo-app` y el registro de npm son accesibles — **verificado**: `expo` 57.0.23 y
  `jest-expo` 57.0.5 responden.
- El repo `planillero-frontend` sólo tiene el `README.md` del commit inicial — **verificado**.
- `RIESGO` — la pantalla consulta el backend, pero **el backend todavía no está desplegado en ningún
  lado**: sólo corre local. El criterio 6 se verifica levantando el backend en la misma máquina, y la
  app apuntando a `localhost`. En un dispositivo físico `localhost` no resuelve al backend de la
  computadora; eso se documenta en el README, no se resuelve en esta tarea.
- `RIESGO` — el emulador de Android no se va a usar para verificar. Los gates son `lint`, `tipos` y
  `tests`; que la app *renderice* bien se comprueba a mano y queda registrado en el PR, no
  automatizado. Automatizar eso es un tema aparte.

## Cómo se prueba

1. `cd frontend && npm ci && npm run lint && npx tsc --noEmit && npm test` — los cuatro en verde.
2. `node .agents/scripts/verificar.mjs --tarea PLAN-3` detecta el proyecto y corre los tres gates.
3. Prueba negativa: se rompe a propósito la ruta que consulta el cliente y el test pasa a rojo.
4. Prueba de integración manual: se levanta el backend de PLAN-2 (`./mvnw spring-boot:run`), se
   arranca la app con `EXPO_PUBLIC_API_URL` apuntando ahí, y la pantalla muestra «conectado». Después
   se baja el backend y la misma pantalla muestra el estado de error.
