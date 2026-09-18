# Tareas — PLAN-9 (Etapa 1)

Sólo `frontend`. La etapa 2 se agrega a este archivo cuando esté resuelta la pregunta `BLOQUEANTE` de la spec.

## frontend *(app móvil)*

- [x] `[frontend]` Instalar `expo-location`, `expo-battery`, `expo-network` y `expo-sqlite` con `npx expo install`; configurar plugins en `app.json`
- [x] `[frontend]` Verificar que la versión de `expo-location` instalada expone `mocked` en Android
- [x] `[frontend]` `src/visit/accuracy.ts` y su test (semáforo, con los bordes 14.9 / 15 / 50 / 50.1)
- [x] `[frontend]` `src/visit/location.ts` y su test (permiso, fix válido, mock location, sin fix)
- [x] `[frontend]` `src/status/useDeviceStatus.ts` (conectividad, batería y GPS)
- [x] `[frontend]` `src/components/DeviceStatusBar.tsx` y su test (sin botones: el criterio 11 aplica al botón "Iniciar Visita" de la etapa 2)
- [x] `[frontend]` `src/db/encryptionKey.ts` y su test
- [x] `[frontend]` `src/db/database.ts` (apertura con SQLCipher, tests con `expo-sqlite` mockeado)

## Verificación

- [x] Gates en verde en `frontend` (`node .agents/scripts/verificar.mjs --tarea PLAN-9`)
- [x] Revisión independiente sin hallazgos `critical` ni `high`
- [x] Cada criterio de la etapa 1 de `01-spec.md` queda cubierto
- [ ] Prueba manual en development build: rechazo de mock location y base ilegible sin la clave

---

# Etapa 2 (se ejecuta cuando PLAN-8 esté en `main`)

## Antes de empezar

- [x] Confirmar que el PR #6 de PLAN-8 está mergeado y que su migración es V7; releer `visits.visits`
- [x] `node .agents/scripts/sincronizar.mjs` y crear la rama en `backend` (`ramas.mjs crear --tarea PLAN-9 --repo backend`)
- [x] Rebasear la rama de `frontend` sobre `main` (necesita `requestWithAuth` de PLAN-10)
- [x] Encender Docker Desktop para los tests del backend

## backend

- [x] `[backend]` `V8__visit_start.sql`: columnas de inicio, `IN_PROGRESS` en el `CHECK`, restricciones de consistencia
- [x] `[backend]` `VisitStatus.IN_PROGRESS`, campos de inicio y `start(...)` en `Visit`
- [x] `[backend]` `ClockConfig` y `DriftCalculator` con `DriftCalculatorTest`
- [x] `[backend]` `findByIdForUpdate` y `existsByOperatorIdAndVisitId` en los repositorios
- [x] `[backend]` `StartVisitRequest`, `StartVisitResponse`, `VisitStartService` y `VisitStartController`
- [x] `[backend]` `GET /operators/me/route-sheet` en `PlanningService` y `PlanningController`
- [x] `[backend]` `VisitStartIntegrationTest` (incluida la concurrencia)
- [x] `[backend]` Emitir `03-contrato-api.md` *(obligatorio: el alcance incluye un cliente)*

## frontend *(app móvil)*

- [x] `[frontend]` Leer `03-contrato-api.md` antes de empezar
- [x] `[frontend]` `src/api/visits.ts` y su test
- [x] `[frontend]` `src/db/agendaSchema.ts` y `DatabaseProvider`; montarlo en `_layout.tsx`
- [x] `[frontend]` `agendaRepository` y su test
- [x] `[frontend]` `useAgenda`
- [x] `[frontend]` `startVisit` y su test
- [x] `[frontend]` `LocationSummary` y su test; `VisitCard` con el botón ≥ 48×48 dp
- [x] `[frontend]` Pantalla `agenda.tsx` con la barra de estado fija; entrada desde `index.tsx`

## Verificación de la etapa 2

- [ ] Gates en verde en `backend` y `frontend`
- [ ] Revisión independiente por repo sin hallazgos `critical` ni `high`
- [ ] Cada criterio 1 a 12 de `01-spec.md` cubierto
- [ ] Prueba manual en development build: agenda offline, inicio con GPS, rechazo de ubicación simulada
