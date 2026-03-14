# Ajuste Local de Textos Desbordados

## Resumen

- El problema ya no se limita a `dashboard.ts`; hay textos definidos directamente en componentes.
- Los casos confirmados son `Desconectada` en `qr-section.tsx` y `Automatizaciones activas` en `overview-section.tsx` y `auth-shell.tsx`.
- El objetivo es evitar desbordes o quiebres visuales sin cambiar comportamiento ni semantica funcional.
- Se permite combinar copy mas corto con ajustes minimos de layout en el punto exacto de render.
- El cambio debe ser puntual, no un rediseño general del dashboard o auth.

## Supuestos

- El problema es visual y local al frontend.
- No se requieren cambios de API, estados ni logica de negocio.
- Ajustes validos incluyen labels mas cortos, `min-w-0`, wrap controlado y pequenas reducciones de tipografia o tracking.
- La mejor solucion puede variar segun el componente, aunque el texto sea similar.

## Decision Log

- Decision: corregir en el componente que renderiza el texto.
  Alternatives: seguir ajustando solo `dashboard.ts`.
  Why: los textos reportados viven en componentes concretos.
- Decision: permitir mezcla de copy y layout minimo.
  Alternatives: solo copy o solo CSS.
  Why: da mas margen para resolver sin perder claridad.
- Decision: validar por componente y no imponer una regla global.
  Alternatives: truncado global o cambio masivo de labels.
  Why: reduce riesgo de romper otras pantallas o empeorar legibilidad.

## Diseno Final

En `FRONTEND/src-web/components/dashboard/qr-section.tsx` se revisara el badge de estado para que `Desconectada` no desborde. La preferencia es mantener el significado del estado y corregir el contenedor local primero; si el badge sigue siendo demasiado estrecho, se podra usar un label visual mas corto solo en ese contexto.

En `FRONTEND/src-web/components/dashboard/overview-section.tsx` se ajustara la card del KPI de automatizaciones para que `Automatizaciones activas` no rompa su encabezado. La opcion preferida es usar un label mas corto y claro o, si hace falta, permitir wrap controlado con `min-w-0` y un tratamiento tipografico mas compacto.

En `FRONTEND/src-web/components/auth/auth-shell.tsx` se aplicara el mismo criterio al bloque lateral donde aparece `Automatizaciones activas`, priorizando claridad y estabilidad visual dentro de la card sin alterar la estructura ni el contenido funcional del panel.
