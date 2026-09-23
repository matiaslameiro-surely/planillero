# Prueba del criterio 3: caché de ESLint envenenada

Reproduce el escenario real: el lint corre mientras falta una dependencia, la caché guarda el error y
después, con la dependencia instalada, el error se repite.

```bash
cd frontend
mv node_modules/ajv-formats node_modules/.ajv-formats-oculto   # simula node_modules desactualizado
touch src/forms/validation.ts                                   # fuerza que el archivo se vuelva a revisar
npx expo lint --max-warnings 0                                  # script VIEJO, con caché
mv node_modules/.ajv-formats-oculto node_modules/ajv-formats    # «npm install»
npx expo lint --max-warnings 0                                  # script VIEJO otra vez
npm run lint                                                    # script NUEVO (--no-cache)
```

## Resultado (23/09, rama PLAN-35 sobre main 02882da)

| Paso | Salida | Exit |
|---|---|---|
| 1. Viejo, sin el paquete | `2:24 error Unable to resolve path to module 'ajv-formats'` | 1 |
| 2. Viejo, con el paquete ya instalado | **el mismo error, sacado de la caché** | 1 |
| 3. Nuevo (`npm run lint`) | sin errores | 0 |

Un intento previo sin el `touch` no reprodujo nada: con el archivo sin cambios, ESLint usó la caché y
no lo volvió a revisar. Eso confirma el mecanismo. La caché envenenada se borró después
(`rm -rf .expo/cache/eslint`, carpeta ignorada por git).
