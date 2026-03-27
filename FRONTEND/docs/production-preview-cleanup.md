# Limpieza Productiva de Preview de Automatizaciones

## Resumen

- La prueba real del bot queda consolidada en `automations-section.tsx`.
- La seccion `debug` sale del dashboard y deja de formar parte del producto final.
- La API expuesta deja de usar naming `debug` y pasa a naming productivo `preview`.
- El flujo activo de prueba queda disponible para cualquier usuario autenticado del negocio.
- La logica central de procesamiento inbound se mantiene para minimizar riesgo.
- Los datos historicos ya marcados como `isDebug` no se migran en esta iteracion.

## Supuestos

- `automations-section.tsx` ya es la unica superficie que debe consumir la prueba real.
- Renombrar ruta, helpers y tipos expuestos es suficiente para limpiar la huella `debug` sin reescribir el motor.
- La autorizacion actual basada en usuario autenticado ya cubre el acceso necesario.
- No hace falta migracion de datos historicos para subir a produccion.

## Decision Log

- Decision: eliminar `debug` del dashboard.
  Alternatives: ocultarlo o dejarlo redundante.
  Why: la prueba ya vive en automatizaciones.
- Decision: renombrar la API expuesta a `preview`.
  Alternatives: mantener el endpoint `debug` con solo cambio visual.
  Why: evita dejar naming de desarrollo en produccion.
- Decision: conservar la logica central de inbound.
  Alternatives: crear un modulo nuevo para pruebas.
  Why: reduce riesgo y mantiene el cambio acotado.
- Decision: no migrar ahora los datos historicos `isDebug`.
  Alternatives: limpieza completa de datos y modelos.
  Why: no bloquea produccion y ampliaria innecesariamente el alcance.

## Diseno Final

En frontend se eliminara la vista `debug` del dashboard, sus imports, su configuracion de navegacion y sus titulos. `automations-section.tsx` quedara como unica superficie para ejecutar la prueba real del bot, usando textos y naming de produccion.

En backend, la capacidad expuesta para simular inbound se renombrara de `debug` a `preview`, junto con los helpers y tipos que hoy conservan esa semantica. La logica central seguira reutilizando el procesamiento inbound actual para minimizar riesgo, pero la API y la capa de UI quedaran alineadas con un flujo productivo.
