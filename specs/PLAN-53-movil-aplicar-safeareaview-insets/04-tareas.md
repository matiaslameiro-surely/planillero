# Tareas — PLAN-53

## frontend *(app móvil)*

- [x] `[frontend]` Envolver `RootLayout` en `src/app/_layout.tsx` con `SafeAreaProvider` de `react-native-safe-area-context`
- [x] `[frontend]` Reemplazar el contenedor raíz en `Agenda` (`src/app/agenda.tsx`) por `SafeAreaView` con `edges={['top']}` y estilo `{ flex: 1, backgroundColor: colors.bgBackdrop }`
- [x] `[frontend]` Crear suite de pruebas `src/app/__tests__/agendaSafeArea.test.tsx` verificando la aplicación de safe area superior y temas
- [x] `[frontend]` Ejecutar suite de pruebas unitarias (`npm test`) y verificar compatibilidad
- [x] `[frontend]` Verificar linter (`npm run lint`) y chequeo de tipos (`npx tsc --noEmit`)

## Verificación

- [x] Gates en verde en los repos del alcance (`node .agents/scripts/verificar.mjs --tarea PLAN-53`)
- [x] Revisión independiente sin hallazgos `critical` ni `high` (`node .agents/scripts/revisar.mjs --tarea PLAN-53 --repo frontend`)
- [x] Cada criterio de aceptación de `01-spec.md` queda cubierto
