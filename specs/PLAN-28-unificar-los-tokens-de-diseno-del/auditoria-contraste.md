# Auditoría de contraste (WCAG 2.1 AA)

Escala de color del backoffice (PLAN-28). Ratio mínimo exigido: 4,5:1. Generado con
`node contrastes.mjs`.

| Par fg/bg | Uso | Ratio | Resultado |
|---|---|---|---|
| `color-primary/color-surface` | acción primaria: texto en enlaces y botones secundarios | 5.61 | AA |
| `color-text/color-surface` | títulos y cuerpo duro | 17.74 | AA |
| `color-text-muted/color-surface` | texto secundario sobre blanco | 5.74 | AA |
| `color-text-muted/color-surface-muted` | texto secundario sobre fondo gris claro | 5.49 | AA |
| `color-text-disabled/color-border` | botón deshabilitado | 6.15 | AA |
| `color-error/color-surface` | errores de campo y feedback | 5.44 | AA |
| `color-success/color-surface` | feedback de éxito | 5.02 | AA |
| `color-warning/color-surface` | feedback de advertencia | 5.02 | AA |
| `color-info/color-surface` | KPI SLA de Supervisión | 6.66 | AA |
| `color-overlay-strong/color-surface` | signature-tag sobre imagen | 13.56 | AA |
| `color-status-ok/color-status-ok-bg` | estado íntegro/completo | 4.57 | AA |
| `color-status-alert/color-status-alert-bg` | estado alterado/error | 5.30 | AA |
| `color-status-pending/color-status-pending-bg` | estado pendiente/demorado | 4.51 | AA |
| `color-status-info/color-status-info-bg` | estado informativo/celeste | 5.17 | AA |
| `color-status-neutral/color-status-neutral-bg` | estado neutro/offline | 6.92 | AA |

**Todos los pares cumplen AA.**
