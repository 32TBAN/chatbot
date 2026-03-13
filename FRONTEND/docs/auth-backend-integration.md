# Acceso Conectado a la Cuenta Real

## Resumen

- La primera etapa de acceso se centrara en permitir que cada usuario entre con su cuenta real.
- El objetivo es dejar atras un acceso de prueba y pasar a una experiencia autentica y consistente.
- En esta fase, la prioridad es el ingreso y la continuidad de la sesion.
- Otras secciones del panel podran seguir mostrando informacion de ejemplo mientras el acceso ya opera de forma real.
- La direccion de acceso se mantendra configurable para facilitar pruebas y despliegues.

## Supuestos

- El sistema podra confirmar correctamente si una persona tiene una sesion valida.
- Si la sesion deja de ser valida, el producto la cerrara y pedira volver a ingresar.
- En esta fase no es necesario conectar aun el resto del panel con informacion real.
- La experiencia debe dejar mensajes claros ante credenciales incorrectas, problemas de conexion o interrupciones de sesion.

## Decision Log

- Decision: priorizar el acceso real como primer paso de conexion.
  Alternatives: conectar varios modulos al mismo tiempo.
  Why: reduce riesgo y permite validar una base solida primero.
- Decision: dejar fuera por ahora otras funciones visibles como registro o recuperacion si no estan listas.
  Alternatives: mostrarlas incompletas o activarlas antes de tiempo.
  Why: evita prometer una experiencia que aun no esta cerrada.
- Decision: mantener la sesion para facilitar continuidad de uso.
  Alternatives: pedir ingreso cada vez.
  Why: mejora la experiencia diaria del usuario.
- Decision: mantener flexible la direccion de conexion del servicio.
  Alternatives: fijarla manualmente.
  Why: ayuda a adaptar el producto a distintos entornos sin friccion.

## Propuesta

El acceso del producto debe conectarse con la cuenta real del usuario y sostener su sesion mientras siga siendo valida. De esta manera, la persona entra con sus credenciales, retoma su trabajo sin pasos extra y solo vuelve a ingresar cuando realmente hace falta.

Si el sistema detecta que la sesion ya no es valida, debe cerrar el acceso de forma ordenada y llevar al usuario nuevamente a la pantalla de ingreso. Si hay errores de credenciales, problemas de conexion o respuestas incompletas, el producto debe explicarlo con mensajes directos y comprensibles.

En esta etapa, el valor principal no esta en activar todos los modulos con informacion real, sino en asegurar una puerta de entrada estable y confiable para el resto de la experiencia.

## Riesgos

- Si el acceso deja de reflejar bien el estado real de la sesion, la experiencia perdera confianza.
- Si los mensajes no distinguen bien entre error de acceso y problema de conexion, el usuario puede frustrarse.
- Si otras areas del panel siguen con informacion de ejemplo por mucho tiempo, puede generarse una expectativa desigual.

## Extension: Recuperacion de Sesion en Configuracion del Negocio

### Resumen

- La carga inicial de `Configuracion` puede fallar aunque la app todavia tenga `sessionUser` con `businessId`.
- El escenario confirmado es `401 Unauthorized` en `GET /api/businesses/me` y `GET /api/business-settings`.
- Ese error no representa un problema de datos del negocio, sino una sesion local que ya no es valida para el backend.
- El frontend no debe mostrar ese caso como "No se pudo cargar la informacion del negocio".
- Para `401` o `403`, la experiencia correcta es invalidar la sesion y devolver al flujo de login con un mensaje claro.
- Los errores de red, configuracion o servidor deben seguir usando el manejo actual con mensaje contextual y opcion de reintento.

### Supuestos

- Los endpoints del negocio y configuracion usan autenticacion protegida con `Bearer`.
- `sessionUser` puede quedar desincronizado respecto al estado real del token.
- El login del usuario es una recuperacion aceptable cuando el backend rechaza el token.
- No es objetivo de este cambio corregir la configuracion interna del backend o JWT.

### Decision Log

- Decision: distinguir `401/403` como `unauthorized` en la capa de servicios.
  Alternatives: mantener `server_error` generico.
  Why: el componente necesita saber si el problema es de sesion o de negocio.
- Decision: invalidar sesion y volver a login cuando la carga del negocio responda `unauthorized`.
  Alternatives: solo mostrar error, solo permitir reintentar.
  Why: la app ya no puede confiar en la sesion local.
- Decision: conservar `loadError` y `Reintentar` para fallos no relacionados con autenticacion.
  Alternatives: unificar todos los errores en una sola experiencia.
  Why: la accion correcta cambia segun el tipo de fallo.
- Decision: reutilizar el contexto de auth para cerrar la sesion con un mensaje de advertencia.
  Alternatives: manejar logout directamente desde el componente.
  Why: evita duplicar logica y mantiene la responsabilidad de auth en un solo lugar.

### Diseno Final

La capa `lib/business.ts` y `lib/business-settings.ts` debe exponer un codigo `unauthorized` cuando el backend responda `401` o `403`. Eso evita que `SettingsSection` trate un rechazo de token como si fuera un error de negocio o de infraestructura.

`SettingsSection` debe detectar ese codigo durante la carga inicial y durante las acciones de guardado relevantes. Cuando ocurra, no debe setear `loadError` ni `formError` genericos, sino disparar una invalidacion de sesion a traves del contexto de autenticacion.

El contexto de autenticacion debe ofrecer una accion para invalidar la sesion y dejar un mensaje visible en la pantalla de login. El mensaje recomendado es: "Tu sesion expiro o ya no es valida. Inicia sesion nuevamente."
