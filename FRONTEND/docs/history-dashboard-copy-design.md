# Ajustes de Copy y Scroll en Historial

## Resumen

- `dashboard.ts` se ajusta solo en textos estaticos que hoy ocupan demasiado espacio en cards y encabezados.
- No se cambian claves, ids, estructura de datos ni secciones del dashboard.
- `history-section.tsx` mantiene la lista completa de conversaciones en la columna izquierda.
- El detalle de la conversacion debe abrir mostrando los mensajes mas recientes.
- El historial completo sigue disponible mediante scroll interno dentro del panel de mensajes.
- El patron visual del scroll reutiliza la solucion ya usada en `debug-section.tsx`.

## Supuestos

- El backend ya entrega mensajes en un orden consistente para poder enfocar la vista al final.
- No hace falta paginacion ni virtualizacion para este cambio.
- El objetivo es mejorar UX visual sin alterar contratos ni comportamiento principal de carga.
- El copy acortado debe conservar el significado funcional del dashboard.

## Decision Log

- Decision: no limitar la lista lateral de conversaciones.
  Alternatives: mostrar solo 10 conversaciones.
  Why: no fue parte del alcance confirmado.
- Decision: mantener todo el historial disponible.
  Alternatives: truncar realmente a 10 mensajes.
  Why: el usuario pidio arrancar en los ultimos 10, pero seguir pudiendo revisar mensajes anteriores.
- Decision: resolver la prioridad de mensajes recientes con auto-scroll al fondo.
  Alternatives: windowing local, slicing, scroll libre sin anclaje.
  Why: es el cambio minimo con mejor UX y menor riesgo.
- Decision: reutilizar el patron visual de `debug-section.tsx`.
  Alternatives: inventar un contenedor nuevo para historial.
  Why: mantiene consistencia visual y reduce riesgo de regresiones.
- Decision: recortar textos solo de forma puntual.
  Alternatives: reescribir todo el contenido del dashboard.
  Why: el alcance confirmado fue conservador y enfocado en desbordes.

## Diseno Final

En `FRONTEND/src-web/data/dashboard.ts` se acortan unicamente textos estaticos que hoy son demasiado largos para espacios compactos del dashboard. El criterio es mantener el significado y el tono actual, pero eliminar redundancias para evitar que cards y encabezados crezcan de mas o rompan su contenedor.

En `FRONTEND/src-web/components/dashboard/history-section.tsx` se envuelve el detalle de mensajes en un contenedor con borde redondeado, altura maxima y `overflow-y-auto`, siguiendo el patron ya presente en `debug-section.tsx`. No se elimina ningun mensaje del arreglo. La vista inicial se resuelve con auto-scroll al fondo cuando cambia la conversacion o se actualiza el total de mensajes, de forma que el usuario aterrice viendo lo mas reciente y aun pueda subir para revisar mensajes anteriores.
