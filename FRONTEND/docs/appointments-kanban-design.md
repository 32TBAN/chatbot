# Tablero Kanban de Citas

## Resumen

- La seccion `Citas` dejara de mostrar placeholders y consumira las citas reales del backend.
- Las citas se organizaran en cuatro columnas que reflejan los estados reales del dominio: `pending`, `confirmed`, `cancelled` y `completed`.
- Cada cita se renderizara como tarjeta con cliente, fecha, hora, descripcion y responsable.
- Las tarjetas podran cambiar de columna por drag and drop o por un selector alternativo en la propia tarjeta.
- Mover una tarjeta no guardara de inmediato; el usuario confirmara los cambios con una accion explicita.
- Si el guardado de una cita falla, esa tarjeta volvera a su estado original y se mostrara un error.
- Si la API responde `401/403`, el frontend debe invalidar la sesion siguiendo el patron ya acordado.

## Supuestos

- `GET /appointments` devuelve las relaciones `customer` y `assignedUser` necesarias para pintar las tarjetas.
- `PATCH /appointments/:id` permite actualizar solo `status`.
- El volumen inicial de citas por negocio es manejable en cliente sin paginacion ni virtualizacion.
- No es objetivo de este cambio editar otros campos de la cita desde el tablero.

## Decision Log

- Decision: usar cuatro columnas que reflejan exactamente los estados backend.
  Alternatives: combinar `confirmed` con `pending`, ocultar estados.
  Why: evita ambiguedad y mantiene consistencia con el dominio real.
- Decision: permitir cambios por drag and drop y por selector alternativo.
  Alternatives: solo drag and drop.
  Why: mejora accesibilidad y soporte movil.
- Decision: no guardar automaticamente al mover.
  Alternatives: autosave, confirmacion inmediata.
  Why: da control explicito al usuario y reduce llamadas innecesarias.
- Decision: guardar solo cambios de `status` en esta iteracion.
  Alternatives: convertir el tablero en editor completo de citas.
  Why: YAGNI; el alcance actual es visualizacion y transicion de estados.
- Decision: revertir solo las tarjetas que fallen al guardar.
  Alternatives: revertir todo el tablero.
  Why: evita perder cambios validos por fallos parciales.

## Diseno Final

Se agregara una capa frontend de citas con tipos explicitamente mapeados desde la API y helpers para listar y actualizar citas. Esa capa distinguira `unauthorized` de otros errores para reutilizar la invalidacion de sesion del contexto de autenticacion.

`appointments-section.tsx` cargara las citas reales al montar y mostrara estados de carga, error y vacio. Internamente mantendra la lista actual de citas y un mapa del estado original por id para detectar cambios pendientes.

El tablero renderizara cuatro columnas. Cada tarjeta podra cambiar de estado via drag and drop nativo o con un selector. Al hacerlo, solo se actualizara el estado local y se marcara como pendiente. La pantalla mostrara un boton global para guardar cambios y otro para descartar modificaciones.

Al guardar, el frontend enviara `PATCH` solo para las citas cuyo estado cambio. Si una falla, esa tarjeta volvera a su estado original y se reportara el error. Si una respuesta es `401/403`, la sesion se invalidara y el usuario volvera a login con mensaje claro.