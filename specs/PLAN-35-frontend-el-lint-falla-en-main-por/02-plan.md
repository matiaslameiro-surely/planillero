# Plan técnico — PLAN-35

## Enfoque

Agregar `--no-cache` al script `lint` del frontend, para que `expo lint` no lea ni escriba
`.expo/cache/eslint` y cada corrida resuelva los imports contra el `node_modules` actual. Se anota el
motivo en el README, porque sin él la opción parece arbitraria y alguien la podría sacar.

## Archivos a tocar

### frontend/

| Archivo | Acción | Para qué |
|---|---|---|
| `package.json` | modificar | `"lint": "expo lint --max-warnings 0 --no-cache"` |
| `README.md` | modificar | Una línea que explique por qué el lint corre sin caché |

## Decisiones técnicas

- **`--no-cache` en el script** — Se descartó configurar el resolver de TypeScript en
  `eslint.config.js` (la propuesta del issue) porque el resolver ya funciona: el problema es la caché.
  También se descartó dejar el código como está y sólo explicar la causa, porque la trampa queda armada
  para el próximo que actualice dependencias.
- **Sin caché en lugar de invalidarla por `package-lock.json`** — ESLint no tiene una opción para
  invalidar la caché según otro archivo, y un script que la borre cuando cambia el lock agrega piezas
  para ahorrar ~1 s por corrida.

## Supuestos

- `expo lint` acepta `--no-cache` (verificado: está en la ayuda de `@expo/cli` y se corrió el 23/09).
- El costo de correr sin caché es bajo (medido: 9 s contra 8 s en esta máquina).

## Cómo se prueba

1. `npm run lint` en la rama → exit 0 (criterio 2).
2. Envenenar la caché: volver al script viejo, cambiar temporalmente el import de `validation.ts` a
   un módulo inexistente, correr el lint con caché para que guarde el error, restaurar el archivo con
   el mismo contenido y mtime, y confirmar que el script viejo repite el error fantasma y el nuevo
   pasa (criterio 3).
3. `grep` de `eslint.config.js` sin cambios (criterio 4).
