# QR en Preview de Automatizaciones

## Resumen

- El preview flotante de `automations-section.tsx` ya consulta el estado real de la sesion de WhatsApp.
- Actualmente no muestra `qrCode`, por eso no cubre el estado de sesion pendiente dentro del mismo panel.
- Se requiere que, si existe `session.qrCode`, el preview reemplace temporalmente el chat por el QR.
- Cuando la sesion quede conectada y activa, el panel debe volver automaticamente al modo de prueba real.
- No se cambia backend ni el contrato de `getWhatsappSession`.
- El cambio queda acotado al preview flotante.

## Supuestos

- `getWhatsappSession` ya entrega `qrCode` correctamente cuando la sesion esta en `pending`.
- El preview no necesita activar ni regenerar la sesion en esta iteracion.
- Mantener el mismo encabezado del panel es suficiente para conservar consistencia visual.
- Si la sesion esta `pending` sin `qrCode`, puede mantenerse un estado informativo.

## Decision Log

- Decision: el QR reemplaza completamente el chat mientras exista y la sesion no este lista.
  Alternatives: mostrar QR y chat al mismo tiempo.
  Why: fue el comportamiento confirmado.
- Decision: no tocar backend.
  Alternatives: agregar activacion o polling especial.
  Why: el dato ya esta disponible en el endpoint actual.
- Decision: limitar el ajuste a `FloatingChatPreview`.
  Alternatives: reutilizar toda la UI de `QrSection`.
  Why: reduce riesgo y evita duplicacion innecesaria.

## Diseno Final

En `FRONTEND/src-web/components/dashboard/automations-section.tsx`, `FloatingChatPreview` incorporara un modo QR. Cuando la sesion este pendiente y `session.qrCode` exista, el panel flotante dejara de mostrar la conversacion y el input de prueba, y renderizara en su lugar la imagen del QR con una instruccion breve para escanearlo desde el telefono principal del negocio.

Cuando la sesion pase a `connected` con runtime activo, el panel volvera al modo actual de prueba real. Si no hay QR disponible y la sesion aun no esta lista, se mantendra el mensaje informativo existente.
