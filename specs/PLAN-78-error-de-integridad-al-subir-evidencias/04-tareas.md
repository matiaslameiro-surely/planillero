# Tareas — PLAN-78

Sin backend: el contrato de subida de evidencias no cambia, así que no hay `03-contrato-api.md`.

## frontend *(app móvil)*

- [x] `[frontend]` `SvgEvidence`, `prepareSvgEvidence` y `uploadSvgEvidence` en `src/api/evidence.ts`
- [x] `[frontend]` `SignaturePad` entrega un `SvgEvidence` del markup
- [x] `[frontend]` Pantalla de evidencias: foto de muestra con markup SVG y subida con `uploadSvgEvidence`
- [x] `[frontend]` `SignaturePad` no pierde el último trazo si movimiento y release llegan juntos
- [x] `[frontend]` Tests de hash contra bytes subidos (foto y firma) y de contenido SVG

## Verificación

- [ ] Gates en verde en los repos del alcance (`node .agents/scripts/verificar.mjs`)
- [ ] Revisión independiente sin hallazgos `critical` ni `high`
- [ ] Cada criterio de aceptación de `01-spec.md` queda cubierto
