# PLAN-48 — Bug: contraste ilegible en pantalla principal del móvil con Modo Oscuro (texto negro sobre fondo negro)

## Contexto y problema

Al utilizar la aplicación móvil en un dispositivo con Modo Oscuro (*Dark Mode*) activado por el sistema operativo, la pantalla principal (`frontend/src/app/index.tsx`) resulta ilegible. El fondo general de la pantalla se renderiza oscuro mediante el `ThemeProvider` con `DarkTheme` configurado en `frontend/src/app/_layout.tsx`. Sin embargo, los componentes de texto (`title`, `subtitle`, `label`, `statusText`, `reason`, `url`) no tienen definida una propiedad `color` explícita dependiente del tema y las tarjetas (`styles.card`) carecen de `backgroundColor` explícito, quedando transparentes sobre el fondo oscuro. Esto provoca que React Native dibuje texto negro sobre fondo oscuro, constituyendo un fallo severo de contraste y accesibilidad (WCAG 2.1 AA).

Asimismo, otras pantallas y componentes móviles (como `agenda.tsx`, `VisitCard.tsx`, `login.tsx` y `formulario.tsx`) presentan inconsistencias similares en Modo Oscuro al omitir colores de texto o fondos de contenedor explícitos o adaptables al tema.

Se requiere implementar un sistema o hook de tema/paleta de colores adaptativa (claro/oscuro), aplicar colores de contraste garantizado a las tarjetas y textos en `index.tsx`, y asegurar la legibilidad y consistencia en el resto de las pantallas móviles.

## Alcance

**Repos que toca:** `frontend` (móvil)

## Criterios de aceptación

1. **Tokens de tema claro y oscuro:** Existe una definición centralizada de tokens de color para temas claro y oscuro (o un hook que resuelva los colores según `useColorScheme()`), cubriendo fondos de pantalla, superficies/tarjetas, bordes y variantes de texto (primario, secundario, atenuado/muted).
2. **Fondo y bordes de tarjetas en pantalla principal (`index.tsx`):** Las tarjetas de diagnóstico y sesión tienen un `backgroundColor` y `borderColor` explícitamente adaptados al tema activo, garantizando que no queden transparentes ni se fundan con el fondo.
3. **Contraste de textos en pantalla principal (`index.tsx`):** Todos los textos de `index.tsx` (`title`, `subtitle`, `label`, `statusText`, `reason`, `url`, texto de indicador de salud) definen colores que garantizan un contraste legible (ratio >= 4.5:1 en texto normal y >= 3:1 en títulos grandes) tanto en Modo Claro como en Modo Oscuro.
4. **Consistencia en pantallas secundarias:** Las pantallas `agenda.tsx`, `VisitCard.tsx`, `login.tsx` y `formulario.tsx` mantienen fondo y contraste legible de textos e inputs tanto en Modo Claro como en Modo Oscuro, evitando textos oscuros sobre fondo oscuro o viceversa.
5. **Pruebas unitarias de tema y contraste:** Se incluyen tests unitarios que verifican la resolución correcta de la paleta según el esquema de color y la presencia de estilos contrastantes en los componentes afectados.

## Fuera de alcance

- Modificaciones en `backend` o `backoffice` (la incidencia es exclusiva del cliente móvil).
- Cambio del framework de navegación o sustitución de `expo-router` / React Native `useColorScheme`.
- Rediseño estructural de los componentes o flujos de usuario (se preserva la estructura y funcionalidad actual, ajustando únicamente estilos, colores y accesibilidad).

## Preguntas abiertas

Ninguna.
