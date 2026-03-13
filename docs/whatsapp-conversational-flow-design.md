# Diseno de Flujo Conversacional de WhatsApp

## Resumen de entendimiento

- El flujo final se implementara en el backend nuevo y `FRONTEND/src/sendMessages.js` no se modificara.
- En la primera interaccion, el bot debe pedir primero como le gustaria al cliente que lo llamen.
- Mientras no exista nombre registrado para el cliente, el bot no debe mostrar menu, catalogo ni citas.
- Cuando el cliente responda su nombre, el backend debe guardarlo en `customers.name`.
- Luego de guardar el nombre, el bot debe enviar un saludo con logo configurado y despues el menu principal.
- El logo de bienvenida se cargara desde `FRONTEND/src-web/components/dashboard/settings-section.tsx`.
- El catalogo se administrara desde `FRONTEND/src-web/components/dashboard/catalog-section.tsx` con productos que puedan enviar texto e imagen o video por WhatsApp.
- La ubicacion sera una automatizacion rapida nueva e independiente del flujo de citas.
- El flujo de citas pedira fecha, hora y motivo, y si la fecha u hora no esta disponible ofrecera reintento explicito con `si/no`.

## Objetivo

Centralizar en el backend nuevo un flujo de WhatsApp mas cercano al comportamiento esperado del negocio, incorporando onboarding por nombre, saludo con media configurable, catalogo multimedia, ubicacion configurable y agenda conversacional persistente.

## No objetivos

- No migrar ni reutilizar `FRONTEND/src/sendMessages.js` como fuente de verdad.
- No construir un editor visual general de flujos mas alla de la expansion puntual del sistema actual.
- No agregar registro obligatorio por email en esta etapa.
- No convertir todo el flujo a una automatizacion totalmente dinamica en el dashboard.

## Supuestos

- El nombre del cliente se guardara en `customers.name`.
- La primera interaccion se determinara por ausencia de nombre o ausencia de estado de onboarding completado.
- El backend sera responsable tanto de persistir el estado conversacional como de ejecutar los envios por WhatsApp.
- Los archivos subidos desde el dashboard tendran almacenamiento persistente accesible por el backend.
- Si una media no esta disponible o falla, el bot enviara solo texto y registrara el error.
- El volumen esperado es de MVP, con concurrencia baja o moderada por negocio.
- Solo usuarios autenticados del negocio podran administrar logo, productos, media y automatizaciones.

## Requisitos no funcionales

- Rendimiento: las respuestas simples deben resolverse en menos de 2 segundos sin contar latencia externa de WhatsApp.
- Escala: el diseno debe soportar multiples negocios con catalogos pequenos y conversaciones concurrentes moderadas.
- Seguridad: cada negocio solo puede acceder a sus propios archivos, configuraciones, productos, clientes y citas.
- Confiabilidad: el estado conversacional no debe depender de memoria del runtime.
- Mantenibilidad: la logica del flujo debe vivir en el backend nuevo, evitando duplicacion con el frontend legado.

## Enfoques evaluados

### Opcion recomendada: extender el motor actual con estado conversacional y respuestas multimodales

Mantener `BACKEND/src/modules/whatsapp-sessions/whatsapp-automation.service.ts` como punto central del flujo, ampliandolo con estado conversacional por cliente y soporte para acciones salientes tipadas como texto, media, ubicacion y documentos.

Ventajas:

- Reutiliza la arquitectura nueva.
- Mantiene una sola fuente de verdad.
- Permite crecer sin mezclar logica con el frontend legado.

Riesgos:

- Toca modulos criticos del flujo de WhatsApp.
- Requiere ampliar persistencia, runtime y dashboard.

### Opcion descartada: orquestador conversacional separado

Crear un modulo paralelo que intercepte mensajes antes del motor actual. Se descarta por duplicar parte de la logica y agregar complejidad innecesaria para el MVP.

### Opcion descartada: flujo totalmente configurable por nodos

Modelar onboarding, citas, ubicacion y media como nodos completamente dinamicos. Se descarta por costo de implementacion alto para el estado actual del producto.

## Diseno final

### 1. Persistencia

Se ampliara `BACKEND/prisma/schema.prisma` en tres frentes:

- `BusinessSettings` almacenara la configuracion del logo de bienvenida.
- `Product` almacenara metadatos de media para WhatsApp, incluyendo tipo, ruta o URL interna del archivo, nombre original y caption de envio.
- Se agregara una entidad de estado conversacional por cliente para recordar onboarding y pasos de cita.

Estado conversacional minimo esperado:

- `awaiting_name`
- `appointment_date`
- `appointment_time`
- `appointment_retry`
- `appointment_subject`

Tambien debe poder guardar datos temporales como fecha y hora seleccionadas.

### 2. Dashboard web

#### Configuracion

`FRONTEND/src-web/components/dashboard/settings-section.tsx` incorporara:

- subida de logo
- preview del logo actual
- guardado de la referencia de archivo en `BusinessSettings`

#### Catalogo

`FRONTEND/src-web/components/dashboard/catalog-section.tsx` dejara de ser placeholder y pasara a soportar CRUD real de productos:

- nombre
- descripcion o caption de WhatsApp
- precio opcional
- activo o inactivo
- imagen o video
- preview de media

El catalogo debe permitir elegir que productos activos seran enviados por la automatizacion de productos.

#### Automatizaciones rapidas

Se agregara una nueva automatizacion rapida `location` en el flujo principal, con:

- mensaje base
- triggers
- latitud
- longitud
- nombre opcional
- direccion o URL opcional

### 3. Runtime de WhatsApp

`BACKEND/src/modules/whatsapp-sessions/whatsapp-runtime.service.ts` se ampliara para poder enviar acciones salientes tipadas en lugar de solo texto.

Tipos de salida esperados:

- `text`
- `media`
- `location`
- `document`

La capa de automatizacion ya no debe devolver `string[]`, sino una lista ordenada de acciones para que el runtime las ejecute de forma secuencial.

### 4. Flujo de primera interaccion

Reglas:

- Si el cliente no tiene nombre registrado, el backend responde solo con la pregunta de nombre.
- El siguiente mensaje se interpreta como nombre.
- El backend guarda el nombre en `customers.name`.
- Luego envia el logo configurado, si existe.
- El caption del saludo seguira la forma `Hola👋 *Nombre* ...`.
- Despues del saludo envia el menu principal.

Si no existe logo configurado, el flujo debe degradar a saludo de texto mas menu.

### 5. Flujo de catalogo

Cuando el intent detectado sea `products`:

- Se envia el mensaje introductorio del catalogo.
- Luego se envian productos activos configurados para WhatsApp.
- Cada producto se envia como:
  - imagen + caption
  - video + caption
  - o texto solo, si no tiene media

Si el archivo falla, el sistema debe enviar solo texto y registrar el incidente.

### 6. Flujo de ubicacion

La ubicacion sera una automatizacion rapida independiente.

Cuando el cliente active el intent `location`:

- El backend envia el mensaje configurado.
- Luego envia una ubicacion con latitud, longitud y metadatos disponibles.

No estara acoplada al flujo de agenda.

### 7. Flujo de citas

Cuando el cliente active `appointments`:

1. El backend crea o actualiza el estado conversacional a `appointment_date` y pide la fecha.
2. Valida el formato y pasa a `appointment_time`.
3. Valida hora y disponibilidad.
4. Si la fecha u hora no esta disponible, responde con mensaje de conflicto y pasa a `appointment_retry`.
5. Si el cliente responde `si`, reinicia la seleccion.
6. Si responde `no`, cierra el flujo.
7. Si la fecha y hora son validas, pide el motivo y pasa a `appointment_subject`.
8. Guarda la cita.
9. Envia confirmacion al cliente.
10. Opcionalmente genera y envia un archivo `.ics`.

### 8. Manejo de errores y degradacion

- Si falta media del logo, enviar saludo de texto.
- Si falta media de producto, enviar solo caption o descripcion.
- Si falla un upload desde dashboard, no alterar la referencia activa existente.
- Si el runtime pierde contexto o reinicia, debe recuperar el estado conversacional desde base de datos.
- Si el cliente responde algo invalido durante cita, debe recibir un mensaje claro y permanecer en el paso correcto.

## Decision log

- Decision: usar el backend nuevo como fuente de verdad.
  Alternatives: mantener el flujo viejo o convivir indefinidamente con ambos.
  Why: evita duplicacion y consolida la arquitectura objetivo.

- Decision: bloquear menu y automatizaciones hasta capturar nombre en primera interaccion.
  Alternatives: mostrar menu en paralelo o saludar primero sin guardar nombre.
  Why: refleja el requerimiento de experiencia y simplifica el onboarding.

- Decision: cargar logo desde dashboard y guardarlo como configuracion del negocio.
  Alternatives: URL externa o rutas manuales del servidor.
  Why: da control operativo al negocio sin depender de configuracion tecnica.

- Decision: permitir media por producto dentro del catalogo.
  Alternatives: catalogo solo de texto o media externa no gestionada.
  Why: replica el comportamiento esperado del envio por WhatsApp.

- Decision: agregar `location` como automatizacion rapida independiente.
  Alternatives: incluirla dentro de citas.
  Why: desacopla responsabilidades y coincide con el flujo deseado.

- Decision: persistir el estado conversacional por cliente.
  Alternatives: manejarlo solo en memoria.
  Why: evita perdida de contexto al reiniciar el runtime y mejora confiabilidad.

- Decision: modelar respuestas salientes como acciones tipadas.
  Alternatives: seguir devolviendo solo texto y agregar excepciones puntuales.
  Why: habilita media, ubicacion y documentos sin romper extensibilidad.

- Decision: en conflictos de cita, reintentar mediante `si/no`.
  Alternatives: reinicio automatico o pedir solo un dato de nuevo.
  Why: mantiene el comportamiento esperado del negocio con una confirmacion explicita.

## Riesgos principales

- El almacenamiento y servido de archivos es el punto mas sensible del cambio.
- El runtime actual esta orientado a texto y debe evolucionar sin afectar estabilidad.
- La deteccion de primera interaccion debe ser consistente para no interrumpir clientes ya conocidos.
- El diseno de la tabla de estado conversacional debe mantenerse simple para no crear deuda innecesaria.

## Handoff a implementacion

La implementacion debe ejecutarse por fases, empezando por persistencia y contratos de API, luego dashboard, despues runtime y finalmente pruebas de flujo completo.
