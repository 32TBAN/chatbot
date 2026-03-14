# Ajuste de Wrap para Conexion WhatsApp

## Resumen

- El problema esta localizado en la card `Conexion WhatsApp` del resumen en `overview-section.tsx`.
- El desborde ocurre con el estado `Desconectada` y el correo largo del usuario.
- El caso reportado se reproduce en una ventana de `1980x665` y persiste desde `1980` de ancho hacia arriba.
- El correo debe mantenerse visible completo.
- Tanto el estado como el correo pueden ocupar varias lineas si hace falta.
- No se cambia comportamiento; el ajuste es solo visual.

## Supuestos

- La causa es el layout interno de la primera card dentro de la grilla `xl:grid-cols-4`.
- No hace falta tocar la grilla general ni las otras cards del resumen.
- El ajuste correcto es local a la card de WhatsApp.
- Clases como `min-w-0`, `break-words`, `leading-tight` y wrap controlado son suficientes para resolver el caso.

## Decision Log

- Decision: no tocar la grilla global del resumen.
  Alternatives: cambiar `xl:grid-cols-4` o redistribuir todas las cards.
  Why: el problema reportado es especifico de una sola card.
- Decision: permitir crecimiento vertical de la card.
  Alternatives: truncar contenido o acortar copy.
  Why: el usuario pidio mantener visibles el estado y el correo completos.
- Decision: aplicar clases condicionales solo a la card `Conexion WhatsApp`.
  Alternatives: aplicar wrap a todas las cards.
  Why: reduce riesgo de alterar cards que ya se ven bien.

## Diseno Final

En `FRONTEND/src-web/components/dashboard/overview-section.tsx` se ajustara solo la card `Conexion WhatsApp`. El encabezado superior puede mantenerse compacto, pero el valor de estado y el detalle con el correo deben renderizarse en bloques con wrap explicito, `min-w-0` y un `leading` mas compacto. La card debe crecer en altura cuando el contenido lo necesite, sin forzar el ancho ni empujar fuera de su contenedor.

El ajuste se hara de forma condicional dentro del `map` de cards, para no modificar la apariencia de metricas mas cortas como citas, productos o flujos activos. La validacion se centra en que `Desconectada` y el correo ya no se salgan del contenedor en `1980x665` y resoluciones mayores.
