# Verificación de contraste — PLAN-25

Escaneo con la fórmula de WCAG 2.1 (luminancia relativa sobre canales linealizados sRGB, contraste
`(L1 + 0,05) / (L2 + 0,05)`) de todas las reglas del backoffice que declaran un `color` de texto.
Si la regla no declara fondo, se supone blanco, igual que la auditoría de PLAN-18 (§8.1).

El script está al lado: `contrast.mjs`. Se corre con `node contrast.mjs scan backoffice/src`.
Lista las reglas por debajo de 4,5:1.

## Antes (main en a05666e, con PLAN-23 ya mergeado)

```
1.00	#fff / #ffffff (supuesto)		app\forms\fields\field-multiselect.component.ts:55	.chip-selected span
1.00	#fff / #ffffff (supuesto)		app\pages\planificacion\planificacion.scss:231	&:hover
2.56	#94a3b8 / #ffffff (supuesto)	0.7rem	app\pages\supervision\supervision.scss:67	&__sub
2.56	#94a3b8 / #ffffff (supuesto)	0.7rem	app\pages\supervision\supervision.scss:138	&__no-visit
3.19	#d97706 / #ffffff (supuesto)		app\pages\supervision\supervision.scss:70	&--demorado
3.30	#16a34a / #ffffff (supuesto)		app\pages\evidence-viewer\evidence-viewer.scss:26	.status-intact
3.76	#ef4444 / #ffffff (supuesto)		app\pages\evidence-viewer\evidence-viewer.scss:25	.evidence-status
3.76	#fff / #ef4444		app\pages\supervision\supervision.scss:151	&--count
3.77	#059669 / #ffffff (supuesto)		app\pages\supervision\supervision.scss:72	&--completo
4.02	#718096 / #ffffff (supuesto)		app\forms\dynamic-form.component.ts:153	.empty-form
4.02	#718096 / #ffffff (supuesto)	12px	app\forms\fields\field-boolean.component.ts:46	.field-description
4.02	#718096 / #ffffff (supuesto)	12px	app\forms\fields\field-multiselect.component.ts:41	.field-description
4.02	#718096 / #ffffff (supuesto)		app\pages\expediente\expediente.component.ts:81	`.visit-details dt
4.02	#718096 / #ffffff (supuesto)	13px	app\pages\expediente\expediente.component.ts:84	`.form-readonly-note
4.02	#718096 / #ffffff (supuesto)	13px	app\pages\expediente\expediente.component.ts:85	`.submitted-at
4.02	#718096 / #ffffff (supuesto)		app\pages\expediente\expediente.component.ts:86	`.no-form
4.10	#0284c7 / #ffffff (supuesto)		app\pages\supervision\supervision.scss:68	&--en-campo
4.13	#e53e3e / #ffffff (supuesto)		app\forms\fields\field-boolean.component.ts:45	.required
4.13	#e53e3e / #ffffff (supuesto)	12px	app\forms\fields\field-boolean.component.ts:63	.field-error
4.13	#e53e3e / #ffffff (supuesto)		app\forms\fields\field-multiselect.component.ts:40	.required
4.13	#e53e3e / #ffffff (supuesto)	12px	app\forms\fields\field-multiselect.component.ts:57	.field-error
4.13	#e53e3e / #ffffff (supuesto)		app\forms\fields\field-number.component.ts:37	.required
4.13	#e53e3e / #ffffff (supuesto)	12px	app\forms\fields\field-number.component.ts:48	.field-error
4.13	#e53e3e / #ffffff (supuesto)		app\forms\fields\field-select.component.ts:38	.required
4.13	#e53e3e / #ffffff (supuesto)	12px	app\forms\fields\field-select.component.ts:48	.field-error
4.13	#e53e3e / #ffffff (supuesto)		app\forms\fields\field-text.component.ts:35	.required
4.13	#e53e3e / #ffffff (supuesto)	12px	app\forms\fields\field-text.component.ts:46	.field-error
4.13	#e53e3e / #ffffff (supuesto)		app\pages\expediente\expediente.component.ts:66	`.error
total pares con color: 84  fallan <4.5: 28
```

## Después (rama PLAN-25)

```
1.00	#fff / #ffffff (supuesto)		app\forms\fields\field-multiselect.component.ts:55	.chip-selected span
1.00	#fff / #ffffff (supuesto)		app\pages\planificacion\planificacion.scss:231	&:hover
1.00	#fff / #ffffff (supuesto)		app\pages\supervision\supervision.scss:156	&--count
3.19	#d97706 / #ffffff (supuesto)		app\pages\supervision\supervision.scss:72	&--demorado
3.77	#059669 / #ffffff (supuesto)		app\pages\supervision\supervision.scss:74	&--completo
4.10	#0284c7 / #ffffff (supuesto)		app\pages\supervision\supervision.scss:70	&--en-campo
total pares con color: 76  fallan <4.5: 6
```

Las 6 que quedan no incumplen el umbral que les corresponde:

| Regla | Por qué el script la marca | Contraste real |
|---|---|---|
| `.chip-selected span` (#fff) | El fondo `#2b6cb0` está en la regla `.chip-selected` | 5,42:1 |
| `planificacion.scss` enlace `&:hover` (#fff) | El fondo `$color-primary` es una variable Sass que el script no resuelve | 5,61:1 |
| `.badge--count` (#fff) | Ídem, fondo `$color-status-alert` (#b91c1c) | 6,47:1 |
| KPI `--demorado` (#d97706) | Es texto grande (1,3 rem en negrita = 20,8 px ≥ 18,66 px): umbral 3:1 | 3,19:1 ✓ |
| KPI `--completo` (#059669) | Texto grande | 3,77:1 ✓ |
| KPI `--en-campo` (#0284c7) | Texto grande | 4,10:1 ✓ |

## Casos que el script no calcula (fondos con transparencia)

| Elemento | Texto | Fondo efectivo | Contraste |
|---|---|---|---|
| Marca «Diferida» de Planificación | #8a5806 | rgba(185,119,14,0,15) sobre blanco = #f5ebdb | 5,11:1 |
| Tarjeta de operador offline | antes `opacity: 0.85`, ahora fondo #f8fafc explícito | — | texto #475569: 7,24:1; #5b6778: 5,49:1 |

## Tamaños

Búsqueda de `font-size` por debajo de 0,75 rem, 12 px o 0,75 em en `.scss`, `.css` y estilos inline:
sin resultados, porque todas las coincidencias son `0.75rem` = 12 px exactos.
