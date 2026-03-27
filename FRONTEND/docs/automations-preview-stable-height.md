# Altura Estable en Preview de Automatizaciones

## Resumen

- El preview flotante de `automations-section.tsx` cambia de altura segun el contenido mostrado.
- Ese cambio mueve la cabecera y la accion de minimizar demasiado hacia arriba.
- Se requiere estabilizar solo el estado expandido del panel.
- La cabecera debe mantenerse fija.
- El cuerpo debe tener altura constante y resolver el contenido con scroll interno.
- No se cambia la logica funcional del preview.

## Supuestos

- El problema es puramente de layout y se resuelve dentro de `FloatingChatPreview`.
- El cuerpo fijo debe soportar QR, conversacion, avisos y errores.
- El estado colapsado no necesita cambios.
- La altura del cuerpo debe seguir respetando el viewport en pantallas bajas.

## Decision Log

- Decision: fijar el cuerpo expandido, no todo el panel.
  Alternatives: altura rigida total o solo `min-height`.
  Why: mantiene estable la cabecera sin volver torpe el panel.
- Decision: mover el scroll al contenido variable interno.
  Alternatives: permitir que el panel siga creciendo.
  Why: evita el salto molesto del boton de minimizar.
- Decision: no tocar la logica funcional del preview.
  Alternatives: reestructurar estados o interacciones.
  Why: el problema reportado es visual.

## Diseno Final

En `FRONTEND/src-web/components/dashboard/automations-section.tsx`, `FloatingChatPreview` incorporara un cuerpo expandido con altura constante, separado de la cabecera. Esa zona fija contendra los avisos superiores, el area visual principal y, cuando aplique, el formulario inferior.

La zona principal del contenido hara scroll interno para manejar los estados de QR, conversacion y mensajes informativos sin empujar la cabecera. El estado colapsado se mantiene intacto.
