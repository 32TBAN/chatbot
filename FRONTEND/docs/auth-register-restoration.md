# Acceso y Creacion de Cuenta

## Resumen

- El producto debe permitir tanto entrar como crear una cuenta desde la misma experiencia de acceso.
- El registro pedira nombre, telefono, correo, contrasena y confirmacion de contrasena.
- El telefono seguira siendo opcional.
- Crear una cuenta no significa completar todo el negocio en ese mismo paso.
- La informacion del negocio podra terminarse mas adelante.
- Los mensajes de acceso deben ser claros, simples y orientados a accion.
- La continuidad de la sesion debe facilitar que el usuario retome su trabajo sin friccion.

## Supuestos

- El producto contara con una forma publica y simple de crear cuentas nuevas.
- El alta de cuenta pedira solo los datos necesarios para comenzar.
- La respuesta despues del registro puede permitir acceso inmediato o pedir al usuario que ingrese con sus credenciales.
- Las personas podran tener una cuenta activa aunque todavia no hayan completado la informacion de su negocio.
- En esta etapa se espera una experiencia rapida, comprensible y estable.

## Decision Log

- Decision: ofrecer `Entrar` y `Crear cuenta` dentro de una misma experiencia.
  Alternatives: pantallas separadas, registro en ventana secundaria.
  Why: simplifica el recorrido y hace mas visible el inicio del producto.
- Decision: dejar el telefono como dato opcional.
  Alternatives: volverlo obligatorio.
  Why: reduce friccion en el primer acceso.
- Decision: permitir que el registro no obligue a completar el negocio en ese mismo momento.
  Alternatives: exigir todo desde el inicio.
  Why: acelera el ingreso y deja la configuracion para el siguiente paso natural.
- Decision: si la cuenta se crea con exito, priorizar un mensaje claro que conduzca al siguiente paso.
  Alternatives: obligar siempre a un ingreso automatico.
  Why: da flexibilidad y evita depender de una sola respuesta posible del sistema.

## Propuesta

La experiencia de acceso tendra dos caminos visibles: entrar y crear cuenta. El objetivo es que una persona nueva pueda comenzar sin rodeos y que una persona existente pueda volver a su panel con rapidez.

El registro pedira solo la informacion esencial para habilitar la cuenta. Una vez creada, el producto puede hacer una de dos cosas: permitir el acceso inmediato o confirmar el registro y llevar al usuario al ingreso normal. En ambos casos, la experiencia debe sentirse clara y sin fricciones.

Si el correo ya existe, si falta informacion o si ocurre un problema de conexion, el producto debe responder con mensajes simples que expliquen que paso y que hacer a continuacion.

## Riesgos

- Si el mensaje posterior al registro no es claro, el usuario puede no entender cual es el siguiente paso.
- Si la cuenta nueva no convive bien con la activacion posterior del negocio, puede haber confusion.
- Si los errores de acceso y los de conexion se mezclan, la experiencia perdera claridad.
