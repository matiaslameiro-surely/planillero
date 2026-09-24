# Plan técnico — PLAN-34

## Enfoque

Tarea de **pruebas manuales y documentación**, no de código de producto. No se toca código de
backend ni de backoffice: el backend se usa tal cual está en su rama base (main) para el recorrido
E2E, y el único repo en el que se versionan cambios es `frontend`.

Tres entregas, en orden de dependencia:

1. **Documentación de la prueba de campo pendiente**: reescribir la §5 y la conclusión 4 de
   `frontend/docs/AUDITORIA_UX_MOVIL.md` para que dejen de afirmar que se hizo una prueba real con
   operador y pasen a declarar el **protocolo pendiente de ejecución** con la ficha técnica lista.
2. **APK de prueba**: construir el APK con `scripts/build-apk.sh` contra la IP de la máquina (Docker
   arriba), levantar el backend al alcance de la red y verificar el login; si no hay tablet ni
   emulador disponible, el entregable queda en build exitoso + verificación de que el backend
   responde en la red + registro del estado.
3. **Recorrido E2E**: con el stack de compose levantado, recorrer a nivel de API el ciclo completo
   que describe el issue (login → 2FA → agenda/hoja de ruta → inicio de visita → formulario →
   evidencias/firma → sync → backoffice) y documentar el resultado en
   `frontend/docs/REGISTRO_E2E.md`. Los fallos se cargan como issues en Jira.

Se aprovecha el seed ficticio ya presente (`V7`, `V13` y `V2/V3`): `operador.demo/Operador123!`,
`supervisor.demo/Supervisor123!`, `admin.demo/Admin123!` y visitas, hojas de ruta y turnos ya
sembrados.

## Archivos a tocar

### frontend/

| Archivo | Acción | Para qué |
|---|---|---|
| `docs/AUDITORIA_UX_MOVIL.md` | modificar | Reemplazar los resultados ficticios de la §5 y la conclusión 4 por el estado de **protocolo pendiente de ejecución** |
| `docs/REGISTRO_E2E.md` | crear | Registro del recorrido E2E con resultados y problemas encontrados |
| `dist-apk/planillero.apk` | generar (no se commitea) | Entregable del APK de prueba contra la IP local |

### backend/ y backoffice/

No se tocan: se usan tal cual (dependencias del entorno, no del commit).

## Decisiones técnicas

- **La prueba de campo se documenta como pendiente, no se fabrica.** El criterio de aceptación del
  issue lo permite explícitamente («o se reescribe como protocolo pendiente de ejecución»), y la
  AGENTS.md prohibe datos ficticios presentados como reales. Se descartó inventar de nuevo un
  resultado porque eso reproduce exactamente el problema que la tarea viene a corregir.
- **Recorrido E2E a nivel de API, no de UI.** No hay dispositivo ni navegador controlable acá para
  recorrer las pantallas de React Native/Angular, pero el backend expone todo el ciclo (auth,
  planificación, visita, formulario, evidencias, sync, supervisión, auditoría). Se descartó simular
  UI porque agregaría fricción sin cubrir la ruta crítica real; el registro deja explícito qué
  capa se verificó (API) y qué queda pendiente de la UI/device.
- **Backend levantado con `docker compose` tal cual**, sin `docker-compose.override.yml` versionado.
  En el override temporal se publica `0.0.0.0:8080` en lugar de `127.0.0.1` para que una tablet en
  la misma red pueda alcanzar el backend; ese override es local y no se commitea (el compose
  versionado publica sólo en loopback a propósito).
- **APK siempre contra una URL verosímil de la red local** (`http://<IP>:8080`), nunca `localhost`,
  porque en la tablet `localhost` es la propia tablet. El build lo advierte solo.

## Supuestos

- `RIESGO` — Docker Desktop quedó operativo después de iniciarlo (se verificó con `docker info`:
  servidor 29.8.0). Si el build del APK o el compose fallan por el entorno, se documenta y se pasa
  el entregable al estado que corresponda; no se inventa un resultado.
- `RIESGO` — No hay tablet física ni emulador disponible en este entorno para instalar el APK. El
  criterio 2 se satisface con el build exitoso que respeta el manifest con cleartext + verificación
  de que el backend responde en la red de la máquina; la instalación efectiva queda registrada como
  pendiente de device.
- El seed de desarrollo trae los datos necesarios para el recorrido (usuarios demo, visitas, hojas
  de ruta, turnos y plantilla de formulario). Se verificó que las migraciones `V7`, `V13` y
  `V2/V3` existen y siembran datos ficticios.

## Cómo se prueba

- El recorrido E2E se ejecuta con `curl`/PowerShell contra el backend real levantado por compose:
  login, 2FA, hoja de ruta, inicio de visita, formulario (validando contra el schema), evidencias +
  manifest, verificación de auditoría (`/api/v1/audit/verify`), sync y tablero de supervisión. Cada
  paso se deja en `docs/REGISTRO_E2E.md` con su resultado.
- El APK se considera generado cuando `scripts/build-apk.sh` termina y existe
  `dist-apk/planillero.apk`; se verifica accesibilidad del backend en la red con
  `curl http://<IP>:8080/health`.