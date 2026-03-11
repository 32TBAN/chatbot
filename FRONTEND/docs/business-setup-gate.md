# Activacion Inicial del Negocio

## Resumen

- Una persona puede entrar al panel aunque todavia no haya completado los datos basicos de su negocio.
- Quien entra por primera vez y quien aun no termina su configuracion seguira el mismo recorrido.
- Mientras falte esa informacion, solo estara disponible la seccion `Configuracion`.
- La restriccion debe comunicarse con claridad mediante un aviso fijo y el bloqueo de navegacion.
- Si alguien intenta abrir una seccion no disponible, el producto lo llevara de vuelta a `Configuracion`.
- La activacion del negocio se considera completa cuando ya existe una identificacion minima del negocio y su nombre principal.
- Esta experiencia debe sentirse como el paso que habilita la operacion, no como un asistente largo y generico.

## Supuestos

- El producto podra reconocer si el negocio ya cuenta con la informacion minima para empezar a operar.
- Las personas sin negocio configurado aun podran ingresar a su cuenta.
- Si hay dudas sobre el estado del negocio, el sistema debe actuar de forma conservadora y mantener el bloqueo.
- La activacion completa de esta experiencia dependera de que el producto pueda guardar esos datos de forma estable.

## Decision Log

- Decision: tratar el primer ingreso y la falta de configuracion como un mismo recorrido.
  Alternatives: bienvenida separada, deteccion especial de primera visita.
  Why: el objetivo es el mismo y se evita complejidad innecesaria.
- Decision: bloquear todo excepto `Configuracion`.
  Alternatives: permitir `Resumen`, mostrar solo advertencias.
  Why: crea un camino claro y evita confusion.
- Decision: combinar aviso visible y redireccion.
  Alternatives: solo aviso, solo bloqueo silencioso.
  Why: el usuario necesita entender la razon y tambien el siguiente paso.
- Decision: considerar completa la activacion cuando exista la informacion basica del negocio.
  Alternatives: pedir menos datos o exigir mucho mas desde el inicio.
  Why: mantiene un umbral minimo claro para el MVP.
- Decision: llevar directamente a cuentas incompletas hacia `Configuracion`.
  Alternatives: dejar al usuario en una pantalla bloqueada.
  Why: reduce ruido y apunta a la unica accion util.

## Propuesta

Cuando el negocio aun no este listo para operar, el panel entrara en un modo restringido. La persona seguira viendo el mapa general del producto, pero solo podra avanzar en `Configuracion`, que sera la puerta de entrada para terminar la activacion.

En la parte superior del panel aparecera un aviso persistente que explique de forma simple por que algunas secciones todavia no estan disponibles y que paso falta para habilitarlas. `Configuracion` se convertira en la pantalla principal para completar los datos iniciales del negocio y destrabar el resto de la experiencia.

En esta etapa, la prioridad es dejar claro el recorrido de activacion y la experiencia visual de bloqueo. La activacion completa dependera de la disponibilidad de guardado real de los datos del negocio.

## Riesgos

- Si el estado del negocio no se detecta bien, podrian habilitarse secciones antes de tiempo.
- Si el producto no puede guardar aun los datos del negocio, la experiencia quedara incompleta.
- Si el bloqueo no se explica bien, el usuario puede sentir friccion innecesaria.
