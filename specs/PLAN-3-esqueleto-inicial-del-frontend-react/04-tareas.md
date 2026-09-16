# Tareas — PLAN-3

## frontend

- [ ] `[frontend]` Generar el proyecto con `create-expo-app` (TypeScript, `expo-router`)
- [ ] `[frontend]` Quitar el boilerplate de ejemplo de la plantilla (componentes, pantallas y temas demo)
- [ ] `[frontend]` Agregar `.gitignore`, `.gitattributes` y `.env.example`
- [ ] `[frontend]` Crear `src/constants/env.ts` con la lectura única de `EXPO_PUBLIC_API_URL`
- [ ] `[frontend]` Implementar `src/api/cliente.ts` con `obtenerSalud()` y manejo de error de red
- [ ] `[frontend]` Configurar `jest-expo` y el script `npm test`
- [ ] `[frontend]` Implementar `src/api/cliente.test.ts`: respuesta correcta y fallo de red
- [ ] `[frontend]` Implementar `app/index.tsx` con los tres estados: consultando, conectado, error
- [ ] `[frontend]` Actualizar el `README.md` con cómo levantar, testear y apuntar al backend

## Verificación

- [ ] `npm ci` desde un clon limpio, sin errores
- [ ] `npm run lint`, `npx tsc --noEmit` y `npm test` en verde
- [ ] Prueba negativa: romper la ruta del cliente hace fallar los tests
- [ ] `node .agents/scripts/verificar.mjs --tarea PLAN-3` corre los tres gates en verde
- [ ] Prueba manual contra el backend de PLAN-2: estados «conectado» y «error» se ven según el backend esté arriba o abajo
- [ ] Revisión independiente sin hallazgos `critical` ni `high`
- [ ] Los 9 criterios de aceptación de `01-spec.md` quedan cubiertos
