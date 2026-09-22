# Plan técnico — PLAN-16

## Enfoque

La tarea PLAN-16 consiste en la auditoría exhaustiva de UX/UI y evaluación ergonómica de la aplicación móvil (`planillero-frontend`) orientada al operador de campo en tablet Android institucional de 10'', conforme a la Sección 5 de la rúbrica institucional del proyecto.

El enfoque técnico se compone de tres pilares:
1. **Auditoría UX y Evaluación Ergonómica de Campo (`frontend/docs/AUDITORIA_UX_MOVIL.md`):**
   - Autoevaluación contra las 10 Heurísticas de Nielsen, con foco en visibilidad de estado (online/offline en `DeviceStatusBar`), coincidencia con el mundo real (coordenadas legibles y semáforo GPS en `LocationSummary`), prevención de errores (validación de formularios, advertencias de desconexión y cola de sincronización) y reconocimiento antes que recuerdo.
   - Evaluación ergonómica para tablets Android de 10'' de campo: targets táctiles >= 48x48 dp para operación con guantes, ratios de contraste WCAG 2.1 AA/AAA bajo luz solar directa / deslumbramiento y usabilidad con una sola mano.
   - Registro formal de pruebas de usabilidad con usuario real (operador de campo en simulación de turno), documentando el guion de prueba, métricas cuantitativas (tiempo por tarea, tasa de éxito) y feedback cualitativo.
2. **Remediación Ergonómica y de Accesibilidad en el Frontend:**
   - Centralizar las constantes y tokens ergonómicos en `src/constants/layout.ts` (`MIN_TOUCH_TARGET = 48`, estilos base para botones y campos táctiles).
   - Ajustar las pantallas y componentes clave (`Login`, `DynamicForm`, `SignaturePad`, `EvidenceScreen`, campos dinámicos y `formulario.tsx`) para asegurar que todos los targets táctiles interactivos alcancen o superen los 48x48 dp, agregando atributos de accesibilidad (`accessibilityRole`, `accessibilityLabel`, etc.) y optimizando el contraste para uso exterior.
3. **Pruebas Automatizadas de Ergonomía:**
   - Implementar tests unitarios en `src/components/__tests__/ergonomics.test.tsx` que verifiquen determinísticamente los tamaños mínimos de interacción táctil y la presencia de etiquetas de accesibilidad en los componentes críticos.

## Archivos a tocar

### frontend/

| Archivo | Acción | Para qué |
|---|---|---|
| `docs/AUDITORIA_UX_MOVIL.md` | crear | Informe completo de auditoría UX/UI, rúbrica Sección 5, matriz de Nielsen, ergonomía de campo y registro de prueba con usuario real. |
| `src/constants/layout.ts` | crear | Constantes ergonómicas centrales (`MIN_TOUCH_TARGET = 48`, tokens táctiles y de accesibilidad). |
| `src/constants/layout.test.ts` | crear | Tests unitarios para las constantes y utilidades de layout ergonómico. |
| `src/app/login.tsx` | modificar | Asegurar `minHeight: 48` en inputs y botón de acceso, con etiquetas de accesibilidad y contraste solar. |
| `src/components/SignaturePad.tsx` | modificar | Asegurar `minHeight: 48` en botones de acción ("Limpiar trazo", "Cancelar", "Confirmar firma") y mejorar contraste y feedback táctil. |
| `src/app/evidence/[visitId].tsx` | modificar | Asegurar `minHeight: 48` en todos los botones de acción ("Agregar foto", "Firmar", "Subir", "Sellar", "Verificar"). |
| `src/forms/DynamicForm.tsx` | modificar | Reemplazar botón nativo por botón táctil accesible con `minHeight: 48` y feedback de envío. |
| `src/forms/fields/FieldText.tsx` | modificar | Altura mínima de 48 dp y bordes/textos de alto contraste. |
| `src/forms/fields/FieldNumber.tsx` | modificar | Altura mínima de 48 dp y teclado numérico ergonómico. |
| `src/forms/fields/FieldSelect.tsx` | modificar | Altura mínima de 48 dp en contenedor de selector y etiquetas legibles. |
| `src/forms/fields/FieldMultiSelect.tsx` | modificar | Altura mínima de 48 dp en chips táctiles seleccionables para uso con guantes. |
| `src/forms/fields/FieldBoolean.tsx` | modificar | Espaciado y accesibilidad ergonómica en switch booleano. |
| `src/app/formulario.tsx` | modificar | Reemplazar uso de `window.location` por `useLocalSearchParams` de Expo Router para robustez nativa. |
| `src/components/__tests__/ergonomics.test.tsx` | crear | Tests unitarios de verificación de targets táctiles (>= 48 dp) y accesibilidad. |

## Decisiones técnicas

- **Centralizar `MIN_TOUCH_TARGET = 48` en `src/constants/layout.ts`** — Se descartó mantener la constante únicamente en `VisitCard.tsx` porque la ergonomía para guantes y campo debe ser un principio transversal a toda la aplicación móvil (login, formularios, evidencias, firma).
- **Mantener `Pressable` y `TouchableOpacity` con `minHeight: MIN_TOUCH_TARGET` y padding amplio en lugar de rediseñar completamente los componentes** — Se descartó introducir librerías externas de UI (como Paper o Tamagui) en esta etapa para no alterar la arquitectura liviana ni generar incompatibilidades con el SDK 57 de Expo.
- **Utilizar `useLocalSearchParams` de Expo Router en `formulario.tsx`** — Se descartó el uso de `window.location` porque en dispositivos Android y emuladores nativos el objeto `window` no existe o no tiene la API estándar de navegación del navegador, provocando fallos en runtime.

## Supuestos

- **Tablet objetivo:** Se asume como dispositivo de referencia una tablet Android de 10'' en orientación portrait/landscape con resolución mínima 1280x800 px y escala de densidad estándar (mdpi/hdpi).
- **Conectividad:** Se asume que el operador opera tanto en línea como fuera de línea (Offline-First), por lo que las ayudas visuales y validaciones de interfaz deben funcionar de manera 100% local en SQLite sin depender de llamadas de red.

## Cómo se prueba

1. **Tests unitarios:**
   - `npm test -- --watchAll=false` en `frontend/`, ejecutando todos los tests existentes más `layout.test.ts` y `ergonomics.test.tsx`.
2. **Chequeo de tipos y linter:**
   - `npx tsc --noEmit` en `frontend/` comprobando que no haya errores de TypeScript.
   - `npm run lint` en `frontend/` comprobando que no haya errores ni warnings de ESLint.
3. **Validación del harness:**
   - `node .agents/scripts/verificar.mjs --tarea PLAN-16` para corroborar el paso determinístico de los gates.
4. **Verificación documental:**
   - Lectura y revisión del informe `frontend/docs/AUDITORIA_UX_MOVIL.md` contrastándolo con los puntos exigidos en la Sección 5 de la rúbrica y la descripción del issue PLAN-16 en Jira.
