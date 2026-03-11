# WhatsApp Session Runtime Design

## Understanding Summary

- Se refactorizara el modulo `whatsapp-sessions` para que el backend sea el dueno del ciclo de vida real de `whatsapp-web.js`.
- El flujo objetivo es: backend crea cliente, backend genera QR, frontend muestra QR, usuario escanea y la sesion queda persistida.
- Cada negocio mantiene una sola sesion de WhatsApp, alineada con la restriccion actual del modelo Prisma.
- El usuario debe poder pausar y reanudar una sesion sin perder credenciales.
- El usuario tambien debe poder cerrar sesion real, eliminar credenciales y requerir un QR nuevo para volver a activar.
- Al reiniciar el backend, las sesiones con credenciales persistidas deben intentar reconectarse automaticamente.
- El frontend consumira el estado por polling HTTP; no se implementara WebSocket ni SSE en esta fase.

## Assumptions

- La integracion real de `whatsapp-web.js` se movera al backend y dejara de depender de `FRONTEND/src/main.js` para operar.
- Las credenciales de `LocalAuth` se guardaran en disco local del backend, una carpeta por sesion.
- Prisma seguira siendo la fuente de verdad para estado visible, QR actual y metadatos operativos.
- La primera version operara en una sola instancia de backend y con baja concurrencia.
- En esta fase no se integraran todavia handlers de mensajes, solo gestion de sesion, QR y estado.
- El frontend web actual se adaptara despues para leer endpoints del backend y renderizar el QR real.

## Decision Log

1. Backend como owner de sesion  
   Se descarto mantener la logica en frontend porque no resuelve persistencia operativa ni restauracion centralizada.

2. Persistencia de credenciales en disco  
   Se eligio `LocalAuth` con filesystem local y no base de datos porque la escala es baja y el flujo actual ya usa ese patron.

3. Polling HTTP para frontend  
   Se descarto WebSocket/SSE porque seria complejidad innecesaria para una primera version con una sola vista de QR.

4. API por intencion y no CRUD generico  
   Se eligieron acciones `activate`, `pause`, `logout` y `me` porque reflejan mejor operaciones de runtime que un simple `PATCH` de estados.

5. Restauracion automatica al reiniciar  
   Se decidio que backend intente levantar sesiones con credenciales persistidas durante el arranque.

6. Diferenciar pausa de cierre real  
   Se decidio extender el enum de estado para representar explicitamente una sesion pausada.

## Proposed Design

### Architecture

El modulo `whatsapp-sessions` se divide en tres responsabilidades:

- `WhatsappSessionsService`  
  Gestiona la persistencia en Prisma. Crea o recupera la fila unica por negocio, guarda `status`, `qrCode`, `phoneNumber`, `connectedAt`, `lastSeenAt` y prepara la respuesta de API.

- `WhatsappRuntimeService`  
  Orquesta clientes `whatsapp-web.js` en memoria. Mantiene un `Map<string, ClientHandle>` por `businessId`, crea clientes con `LocalAuth`, suscribe eventos (`qr`, `ready`, errores, desconexion) y coordina pausa, restauracion y logout.

- `WhatsappSessionsController`  
  Expone una API orientada a flujo operativo y no a CRUD.

### Runtime Model

Cada cliente se crea con una configuracion equivalente a la usada hoy en `FRONTEND/src/main.js`, adaptada a backend:

- `Client` de `whatsapp-web.js`
- `LocalAuth({ clientId: sessionKey, dataPath: <backend-session-root> })`
- `puppeteer.headless = true`
- `restartOnAuthFail = true`

El runtime sera responsable de:

- evitar clientes duplicados por negocio
- ignorar eventos tardios de clientes invalidados
- actualizar Prisma desde eventos del cliente
- destruir clientes en pausa sin borrar credenciales
- hacer logout real y limpiar credenciales en cierre total
- restaurar sesiones existentes en `onModuleInit`

### Persistent State

Prisma seguira teniendo una sola fila `WhatsappSession` por negocio. Se propone ampliar el enum:

- `pending`
- `connected`
- `paused`
- `disconnected`
- `expired`

Semantica:

- `pending`: cliente inicializado y esperando escaneo o nuevo QR.
- `connected`: sesion autenticada y cliente operativo.
- `paused`: cliente detenido por decision del usuario, con credenciales preservadas.
- `disconnected`: cliente no operativo por logout o desconexion no recuperada.
- `expired`: credenciales invalidas o autenticacion vencida.

Campos:

- `qrCode`: ultimo QR disponible para polling del frontend.
- `phoneNumber`: numero autenticado si existe.
- `connectedAt`: fecha de conexion exitosa.
- `lastSeenAt`: ultima actividad o evento relevante del cliente.

### API Contract

- `GET /whatsapp-sessions/me`  
  Devuelve la sesion del negocio autenticado o una vista vacia si todavia no existe.

- `POST /whatsapp-sessions/activate`  
  Crea la fila si no existe. Si hay credenciales validas, levanta el cliente y reconecta. Si no las hay, inicializa cliente y espera evento `qr`.

- `POST /whatsapp-sessions/pause`  
  Destruye el cliente en memoria, conserva credenciales y marca estado `paused`.

- `POST /whatsapp-sessions/logout`  
  Ejecuta logout real, destruye cliente, limpia credenciales locales y deja la sesion lista para un QR nuevo.

- `GET /whatsapp-sessions/health`  
  Opcional. Puede exponer indicadores de runtime si luego se necesitan.

Todos los endpoints deben seguir protegidos con `JwtAuthGuard` y derivar `businessId` exclusivamente del usuario autenticado.

### Frontend Flow

El frontend web consultara `GET /whatsapp-sessions/me` cada 3 a 5 segundos mientras la vista QR este abierta.

- Si `status = pending` y `qrCode` existe, renderiza el QR.
- Si `status = connected`, muestra estado conectado y metadatos del dispositivo.
- Si `status = paused`, muestra accion para reactivar.
- Si `status = disconnected` o `expired`, ofrece activar para generar o regenerar QR.

### Event Handling

- Evento `qr`  
  Actualiza `status = pending`, guarda el QR mas reciente y marca `lastSeenAt`.

- Evento `ready`  
  Limpia `qrCode`, marca `status = connected`, completa `phoneNumber` si esta disponible y actualiza `connectedAt` y `lastSeenAt`.

- Evento de desconexion o fallo de autenticacion  
  Limpia `qrCode` y marca `disconnected` o `expired` segun la causa.

- Pausa  
  Destruye cliente sin `logout`, conserva filesystem de `LocalAuth` y deja `paused`.

- Logout  
  Ejecuta `logout`, destruye cliente, intenta borrar credenciales locales y deja `disconnected`.

### Edge Cases

- Requests concurrentes a `activate` no deben crear dos clientes para el mismo negocio.
- Un QR nuevo reemplaza al anterior y frontend siempre lee el ultimo valor persistido.
- Eventos tardios de un cliente ya destruido deben ignorarse.
- Si la restauracion automatica falla por credenciales invalidas, la sesion debe quedar lista para reactivacion manual.
- Si falla el borrado de credenciales en logout, la API no debe reportar exito falso.

### Non-Functional Requirements

- Performance  
  Debe soportar decenas de sesiones en una sola instancia sin balanceo.

- Security  
  No se acepta `businessId` desde requests. Todas las acciones se limitan al negocio autenticado.

- Reliability  
  Las sesiones persistidas deben restaurarse al reiniciar el backend, siempre que existan credenciales validas.

- Maintenance  
  La logica de runtime debe quedar separada de la logica de persistencia para permitir pruebas y futura integracion de handlers de mensajes.

## Implementation Handoff

### Suggested Phases

1. Extender Prisma  
   Agregar estado `paused` y cualquier ajuste de esquema necesario.

2. Extraer runtime  
   Crear `WhatsappRuntimeService` y mover ahi la logica base de `Client`, `LocalAuth` y sus eventos.

3. Refactorizar servicio actual  
   Convertir `WhatsappSessionsService` en capa de persistencia y coordinacion.

4. Reemplazar controller  
   Sustituir CRUD por endpoints `me`, `activate`, `pause`, `logout`.

5. Restauracion al arranque  
   Implementar `onModuleInit` para levantar sesiones existentes con credenciales locales.

6. Adaptar frontend web  
   Consumir `GET /me` por polling y renderizar QR/estado real.

7. Agregar pruebas  
   Cubrir transiciones de estado, deduplicacion de clientes y acciones principales.

### Out of Scope

- Envio y recepcion de mensajes.
- Escalado multi-instancia.
- Sincronizacion en tiempo real por sockets.
