# PLAN-57 — Móvil: corregir contraste de textos en DeviceStatusBar para tema oscuro

## Contexto y problema

`frontend/src/components/DeviceStatusBar.tsx` muestra la batería, el GPS y las visitas pendientes con
el estilo `styles.item`, que sólo define `fontSize: 14` y ningún `color`. Android pinta entonces el
texto en negro, y en tema oscuro la barra queda sobre el fondo de la pantalla (`bgBackdrop` oscuro,
`#0f172a`). Negro sobre `#0f172a` da **1.18:1**: el texto es prácticamente invisible.

El issue nombra «Batería XX%» y «X visitas pendientes», pero el texto del GPS usa el mismo estilo y
tiene el mismo problema cuando dice «GPS listo». Cuando el GPS no está listo, el texto usa un rojo fijo
(`#c0392b`) que sobre el fondo oscuro da **3.28:1**, también por debajo del mínimo.

La barra no tiene fondo propio: toma el de la pantalla que la contiene (hoy sólo `agenda.tsx`, con
`colors.bgBackdrop`).

## Alcance

**Repos que toca:** `frontend` (móvil)

## Criterios de aceptación

1. `styles.item` deja de depender del color por defecto del sistema: los textos de batería, GPS y
   visitas pendientes toman su color de `useThemeColors()`.
2. En tema claro y en tema oscuro, los textos «Batería XX%», «GPS listo» y «X visitas pendientes»
   tienen un contraste de al menos 4.5:1 contra el fondo de la barra.
3. El aviso del GPS cuando no está listo («GPS apagado», «GPS sin permiso», «GPS sin datos») también
   tiene al menos 4.5:1 en los dos temas, y se sigue distinguiendo del resto por peso y color.
4. La barra declara su propio fondo tomado del tema, para que el contraste no dependa de la pantalla
   que la contiene.
5. El chip «Modo conectado» tiene al menos 4.5:1 entre el texto blanco y su fondo, en los dos
   temas. «Modo offline» ya lo cumple (5.44:1) y no cambia.
6. Hay tests que renderizan la barra en tema claro y en tema oscuro, y verifican los colores usados y
   su contraste contra el fondo de la barra, y el contraste de los dos chips de modo.
7. Los gates del frontend (`lint`, `tipos`, `tests`) pasan en verde.

## Fuera de alcance

- Revisar el contraste de otras pantallas o componentes.
- Cambiar los tokens de `LIGHT_THEME` / `DARK_THEME`.

## Preguntas abiertas

- [x] `NO-BLOQUEANTE` El chip «Modo conectado» (blanco sobre `#1a9e5c`) da **3.45:1** en los dos
  temas, por debajo de 4.5:1 para texto de 14 px en negrita. **Resuelta:** el usuario pidió sumarlo
  en el checkpoint del plan (criterio 5).
