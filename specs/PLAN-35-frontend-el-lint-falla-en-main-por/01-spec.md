# PLAN-35 — Frontend: el lint falla en main por import/no-unresolved de 'ajv-formats'

## Contexto y problema

El issue dice que `npm run lint` falla en `main` del frontend por
`src/forms/validation.ts 2:24 Unable to resolve path to module 'ajv-formats' import/no-unresolved`,
y supone que el problema es la configuración del resolver de `eslint-plugin-import`.

Al investigarlo, la causa resultó otra. **No es un defecto del código ni de la configuración de ESLint:
es una caché local vieja.**

- `npm run lint` corre `expo lint`, que por defecto usa la caché de ESLint en `.expo/cache/eslint`.
  Esa carpeta está en `.gitignore`, así que es propia de cada máquina.
- La caché de ESLint invalida una entrada cuando cambia el archivo o la configuración, **no cuando
  cambia `node_modules`**. Si se corre el lint con `node_modules` desactualizado (sin `ajv-formats`
  instalado), el error queda guardado y se repite aunque después se instale la dependencia.
- Así pasó en la máquina donde se detectó: el 21/09 `node_modules` estaba viejo y se arregló con
  `npm ci` durante PLAN-15, pero `validation.ts` no se volvió a tocar y el error siguió saliendo de la
  caché. El error gemelo de `FieldSelect.tsx` (`@react-native-picker/picker`) desapareció justamente
  cuando PLAN-16 modificó ese archivo e invalidó su entrada.

Evidencia (23/09, `main` en `02882da`):
- `npx eslint src/forms/validation.ts` → exit 0. Con `DEBUG=eslint-plugin-import:resolver:*`, el
  resolver encuentra `node_modules/ajv-formats/dist/index.js`.
- `npx expo lint --max-warnings 0 src/forms/validation.ts` → el error de arriba.
- `npx expo lint --max-warnings 0 --no-cache` → exit 0 en todo el proyecto.

La trampa puede repetirse con cualquiera del equipo: alguien hace `pull` de un cambio que agrega una
dependencia, corre el lint antes de `npm install`, y queda con un error fantasma que no se va solo.

## Alcance

**Repos que toca:** `frontend`

## Criterios de aceptación

1. El script `lint` de `frontend/package.json` corre sin caché: `expo lint --max-warnings 0 --no-cache`.
2. `npm run lint` pasa en la rama (exit 0, sin errores ni warnings).
3. Con una caché envenenada (una entrada guardada con el error de `ajv-formats`), `npm run lint`
   igual pasa, porque no la lee.
4. La regla `import/no-unresolved` sigue activa: no se desactiva ni se ignora ningún módulo.
5. El README del frontend dice que el lint corre sin caché y por qué.

## Fuera de alcance

- Cambiar la configuración de ESLint o del resolver (`eslint.config.js`): no hay nada roto ahí.
- El lint del backoffice (Angular), que no usa `expo lint`.
- Cambiar el comando de lint del harness (`workspace.json`), que ya llama a `npm run lint`.

## Preguntas abiertas

Ninguna. El enfoque (`--no-cache` en el script) lo aprobó el usuario el 23/09, después de ver el
diagnóstico. Costo medido: 9 s sin caché contra 8 s con caché.
