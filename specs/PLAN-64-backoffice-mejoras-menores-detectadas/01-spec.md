# PLAN-64 — Backoffice: mejoras menores detectadas en la prueba del 25/09

## Contexto y problema

Detectadas el 25/09 en la prueba E2E del backoffice sobre `main` y en la prueba manual de las tareas
de los sprints «5 - Fix de bugs». Ninguna rompe funcionalidad, pero se notan al usar la app.

Verificado en el código (25/09):
1. **Tipografía:** `src/styles.scss` no tiene regla para `body`. Las pantallas que no ponen
   `font-family` en su propio estilo (Supervisión, Expediente, Visor de evidencias y Acceso denegado)
   se ven con la letra por defecto del navegador, con serifa. El token existe: `$font-base`.
2. **Dos `<main>`:** el layout (`app.html`, `main.app-main`) y seis páginas abren su propio `<main>`
   (acceso denegado, auditoría, inicio, login, planificación y supervisión, que además tiene un
   `<main class="supervision-main">` interno).
3. **Operador en el backoffice:** `operador.demo` entra y ve «Secciones operativas» vacío. Las
   secciones sólo se muestran a supervisor y administrador; el resto de las rutas ya lo mandan a
   «Acceso denegado».
4. **Jurisdicción cruda:** el expediente muestra `ZONA_NORTE`. Lo mismo el selector de operadores de
   Planificación (`operador.demo (ZONA_NORTE)`) y el encabezado de Supervisión.
5. **Fecha cruda en el aviso de asignación:** `planificacion.ts` arma «… para 2026-09-25.» con
   `sheet.date`, sin `formatAppDay`.

## Alcance

**Repos que toca:** `backoffice`

## Criterios de aceptación

1. `body` usa `$font-base`: Supervisión, Expediente, Visor de evidencias y Acceso denegado se ven con
   la tipografía de la app.
2. Cada pantalla tiene un único landmark `main`: el del layout. Las páginas usan un contenedor sin
   rol (`div`) con la misma clase, así los estilos no cambian.
3. Un usuario sin rol de supervisor ni de administrador ve en Inicio, en lugar de «Secciones
   operativas» vacío, el aviso: «Tu usuario es de operador de campo. El backoffice es para
   supervisores y administradores; para tu trabajo usá la app móvil.». La sesión y el botón «Cerrar
   sesión» siguen disponibles.
4. La jurisdicción se muestra traducida donde se ve: expediente, selector de operadores de
   Planificación y encabezado de Supervisión (`ZONA_NORTE` → «Zona Norte», `ZONA_SUR` → «Zona Sur»,
   `GLOBAL` → «Global»). Un código sin traducción se muestra tal cual, como el resto de las etiquetas.
5. El aviso de asignación dice la fecha como dd/mm/aaaa (`formatAppDay`).
6. Tests que cubren 1 a 5 (una guardia sobre los archivos para 1 y 2, como la de tipografía) y gates
   en verde.

## Fuera de alcance

- No dejar entrar al operador (bloquear el login por rol): cambia la autenticación y lo que devuelve
  el backend. Con el aviso alcanza para que no vea una pantalla vacía.
- Rediseñar las pantallas que hoy toman la tipografía global.

## Preguntas abiertas

- [x] `NO-BLOQUEANTE` — **¿Aviso o bloqueo para el operador?** Aviso (ver Fuera de alcance).
- [x] `NO-BLOQUEANTE` — **¿Qué jurisdicciones traducir?** Las del seed (`ZONA_NORTE`, `ZONA_SUR`,
  `GLOBAL`). Una nueva se ve cruda hasta que se agregue, igual que cualquier código sin etiqueta.
