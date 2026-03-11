# MVP Comercial

## Resumen

- Esta primera version presenta una solucion para negocios que atienden, venden y organizan procesos desde WhatsApp.
- El foco esta en ordenar tareas repetitivas, responder con rapidez y dar visibilidad sobre lo que pasa en la operacion diaria.
- Los usuarios principales son duenos, administradores y personas encargadas de la atencion.
- La accion mas importante del producto es configurar automatizaciones sin friccion ni complejidad innecesaria.
- La experiencia debe sentirse como una herramienta de trabajo clara, confiable y directa.
- El alcance inicial esta pensado para negocios pequenos que operan con una sola linea de WhatsApp y un equipo reducido.
- La estabilidad del servicio es clave porque impacta la atencion diaria al cliente.

## Supuestos

- Esta primera etapa incluira puesta en marcha del negocio, conexion por QR, automatizaciones, catalogo, citas, historial esencial y ajustes generales.
- Metricas avanzadas y niveles complejos de permisos no seran prioridad en esta fase.
- La experiencia estara optimizada para escritorio y funcionara correctamente en movil.
- La informacion de clientes y conversaciones se tratara con un nivel serio de resguardo.
- Antes de ampliar el alcance, se validaran recorridos y experiencia de uso con una version controlada del producto.

## Requisitos del servicio

- Rapidez: la navegacion y la edicion deben sentirse fluidas en el uso diario.
- Escala inicial: una cuenta de WhatsApp, de 1 a 5 usuarios internos y un volumen moderado de conversaciones al mes.
- Seguridad: acceso protegido al panel y separacion clara de la informacion por negocio.
- Confiabilidad: estados, reglas activas y citas deben verse de forma consistente.
- Mantenimiento: el producto debe crecer de manera simple, ordenada y facil de sostener.

## Decision Log

1. Se decidio enfocar la propuesta en la operacion del negocio dentro de WhatsApp.
   Alternativas consideradas: asistente conversacional general, panel centrado en metricas.
   Motivo: el mayor valor esta en resolver tareas reales del negocio.

2. Se eligio una primera version utilizable y enfocada.
   Alternativas consideradas: una solucion mas amplia o una propuesta solo visual.
   Motivo: permite salir al mercado con valor real sin abrir demasiado el alcance.

3. Se definio como usuario principal al dueno, administrador y operador.
   Alternativas consideradas: atender solo a uno de esos perfiles.
   Motivo: el producto debe servir tanto para configurar como para operar.

4. Se priorizaron las automatizaciones como centro de la propuesta.
   Alternativas consideradas: dar mas peso a la conexion, el monitoreo o el historial.
   Motivo: ahi se concentra el ahorro de tiempo y la mejora operativa.

5. Se eligio una presentacion sobria y funcional.
   Alternativas consideradas: una propuesta mas decorativa o mas cercana a un panel generico.
   Motivo: la herramienta debe transmitir orden, control y claridad.

6. Se decidio mostrar cada automatizacion como una secuencia facil de entender.
   Alternativas consideradas: configuraciones largas o tablas frias.
   Motivo: ayuda a comprender rapido que activa una accion y que resultado produce.

7. Se limito el historial a seguimiento operativo.
   Alternativas consideradas: convertirlo desde el inicio en una solucion completa de gestion comercial.
   Motivo: mantener el enfoque del MVP.

8. Se dejo el modulo de citas en un formato practico y liviano.
   Alternativas consideradas: una agenda mucho mas completa.
   Motivo: conservar velocidad y claridad en esta etapa.

## Territorio de marca

### Mundo del producto

- Centro de control
- Atencion organizada
- Reservas y turnos
- Catalogo compartido
- Estado de conexion
- Reglas activas
- Seguimiento de interacciones

### Universo visual

- Grafito
- Verde senal
- Ambar operativo
- Marfil
- Acero mate
- Azul gris
- Rojo de alerta

### Idea central

- Una mesa de control donde el negocio puede ver, ordenar y activar su operacion dentro de WhatsApp.

## Propuesta del MVP

### Direccion del producto

El producto se presenta como una mesa de control para pequenos negocios que gestionan su atencion y parte de sus procesos desde WhatsApp. No busca ser una plataforma compleja ni una solucion llena de modulos secundarios. Su valor esta en ayudar a operar mejor, con orden, rapidez y visibilidad.

### Secciones principales

- Resumen
- Automatizaciones
- Conexion QR
- Citas
- Catalogo
- Historial
- Configuracion

### Acceso

Antes de entrar al panel, el usuario debe pasar por una pantalla de acceso clara y dedicada. Mientras no exista una sesion valida, solo vera la experiencia de ingreso.

### Resumen

La pantalla inicial debe mostrar de forma simple:

- Estado de conexion de WhatsApp
- Automatizaciones activas
- Citas proximas o pendientes
- Alertas importantes
- Lista de pasos para terminar de poner en marcha el negocio

Las metricas no seran protagonistas en esta primera etapa.

### Automatizaciones

Este es el corazon del producto. Cada flujo debe explicarse de manera visual y simple:

- Que lo activa
- Que condicion puede intervenir
- Que accion ocurre
- Que resultado se espera

La idea es que cualquier responsable del negocio pueda entender rapidamente como funciona cada automatizacion.

### Modulos de apoyo

#### Conexion QR

- Estado actual de la linea
- Codigo QR cuando haga falta
- Ultima sincronizacion
- Telefono vinculado
- Acciones para reconectar o reemplazar la sesion

#### Citas

- Agenda del dia
- Bloques disponibles
- Confirmaciones pendientes

#### Catalogo

- Productos o servicios visibles
- Precio
- Disponibilidad
- Categoria

#### Historial

- Cliente
- Motivo del contacto
- Automatizacion involucrada
- Resultado
- Fecha

#### Configuracion

- Datos del negocio
- Horarios de atencion
- Mensaje de bienvenida
- Ajustes generales

### Pantalla de acceso

El ingreso debe sentirse como parte del producto y no como una pantalla aislada. Debe explicar con claridad a que herramienta se entra y permitir dos acciones visibles:

- Entrar
- Crear cuenta

#### Ingreso

- Correo
- Contrasena
- Boton principal: `Entrar`
- Opcion visible para recuperar acceso
- Cambio claro hacia `Crear cuenta`

#### Registro

- Nombre
- Telefono
- Correo
- Contrasena
- Confirmar contrasena
- Boton principal: `Crear cuenta`

#### Comportamiento esperado

- Si la cuenta se crea con exito, la persona debe poder empezar rapidamente.
- Si el correo ya existe, el producto debe orientar al usuario para recuperar el acceso.
- Los mensajes deben ser claros cuando falten datos, haya errores de acceso o exista un problema de conexion.

## Sistema de interfaz

- La experiencia debe sentirse directa, profesional y confiable.
- La identidad visual combinara tonos sobrios con acentos de senal y alerta.
- La lectura debe ser clara y la informacion debe verse ordenada.
- El panel debe priorizar utilidad sobre adorno.

## Riesgos

- Mezclar demasiado pronto el acceso con la configuracion inicial del negocio.
- Generar mensajes confusos al usuario cuando algo falle.
- Hacer demasiado complejo el modulo de automatizaciones.
- Convertir el historial en una solucion mucho mas amplia de lo previsto.
- Cargar el modulo de citas con mas funciones de las necesarias.

## Etapas sugeridas

1. Base visual y estructura general del producto.
2. Acceso y navegacion principal.
3. Resumen operativo y puesta en marcha del negocio.
4. Automatizaciones como modulo central.
5. Conexion QR, citas y catalogo.
6. Historial y configuracion.
7. Activacion progresiva de informacion real y validacion de uso.
