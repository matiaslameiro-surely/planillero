# Tareas — PLAN-34

Checklist en orden de dependencia. El backend y el backoffice se usan tal cual (sin cambios de
código); el único repo con commits es `frontend`.

## backend

- [x] `[backend]` Verificar que el seed levanta: `docker compose up` de postgres + backend
- [x] `[backend]` Confirmar credenciales demo y endpoints del ciclo (login, 2FA, hoja de ruta, visita, formulario, evidencias, sync, supervisión, auditoría)

## frontend *(app móvil)*

- [x] `[frontend]` Reescribir la §5 y la conclusión 4 de `docs/AUDITORIA_UX_MOVIL.md` como «protocolo pendiente de ejecución», con la ficha técnica T1–T6 lista y sin resultados fabricados
- [x] `[frontend]` Generar el APK con `sh scripts/build-apk.sh http://<IP>:8080` y verificar que existe `dist-apk/planillero.apk`
- [x] `[frontend]` Verificar que el backend responde en la red de la máquina (camino de la tablet)

## backoffice *(web)*

- [x] `[backoffice]` Confirmar que el compose levanta el backoffice contra el backend (sólo como verificación del entorno, sin cambios en el repo)

## Recorrido E2E y registro

- [x] Ejecutar el ciclo completo a nivel API con el stack levantado: login → 2FA (supervisor) → hoja de ruta del operador → inicio de visita → formulario → evidencias + manifest → sync → tablero de supervisión → verificación de auditoría
- [x] `[frontend]` Escribir `docs/REGISTRO_E2E.md` con el resultado de cada paso y los problemas encontrados
- [ ] Cargar en Jira como bugs las fallas reales que aparezcan (si hubiera) — **no hubo fallas (21/21 OK)**

## Verificación

- [ ] Gates en verde en `frontend` (`node .agents/scripts/verificar.mjs`)
- [ ] Revisión independiente sin hallazgos `critical` ni `high`
- [ ] Cada criterio de aceptación de `01-spec.md` queda cubierto