# Gate `lint` del frontend: falla en `main`, no por PLAN-15

`node .agents/scripts/verificar.mjs --tarea PLAN-15` da `ok: false` **sólo** por el paso `lint` del
repo `frontend`. Los otros 8 pasos (backend: compilar y tests; backoffice: lint, tipos y tests;
frontend: tipos) están en verde.

## Salida

```
src/forms/fields/FieldSelect.tsx
  2:24  error  Unable to resolve path to module '@react-native-picker/picker'  import/no-unresolved
src/forms/validation.ts
  2:24  error  Unable to resolve path to module 'ajv-formats'  import/no-unresolved
✖ 2 problems (2 errors, 0 warnings)
```

## Por qué no es de esta tarea

Se reprodujo **sobre `main` limpio**, sin ningún commit de PLAN-15:

```bash
cd frontend
git checkout main          # HEAD 850c6d7
npm run lint               # → los mismos 2 errores
git checkout PLAN-15-task-02-dockerizacion-integral-del
```

- El diff de PLAN-15 en `frontend` son 5 archivos: `.gitignore`, `.dockerignore`, `README.md`,
  `docker/Dockerfile.apk` y `scripts/build-apk.sh`. Ninguno está bajo `src/` ni es configuración de lint.
- Los dos archivos que fallan vienen de PLAN-13 (`src/forms/...`).
- Ambos paquetes **están instalados** (`node_modules/@react-native-picker/picker`,
  `node_modules/ajv-formats` 3.0.1), y `tsc --noEmit` compila sin errores: el problema es la regla
  `import/no-unresolved` de ESLint en esta máquina, no una dependencia faltante.

## Contexto de la reproducción

El `node_modules` local estaba desactualizado respecto de `main` (tenía `ajv` 6.15 y no tenía
`ajv-formats`), lo que además hacía fallar `tsc`. Se corrigió con `npm ci`; después de eso `tsc` pasó
y quedaron sólo estos 2 errores de lint.

## Qué se hace

Nada en esta tarea: corregirlo implica tocar la configuración de ESLint o código de producto de
PLAN-13, fuera del alcance de PLAN-15. Va al cuerpo del PR para que la revisión humana lo vea, y
conviene abrir una tarea aparte (probablemente un `settings` de `eslint-plugin-import` para el resolver
de TypeScript, o `import/no-unresolved` ignorando estos dos módulos).
