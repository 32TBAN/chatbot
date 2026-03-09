# MVP UI Design

## Understanding Summary

- Se definió un MVP operativo para una plataforma web que automatiza procesos de negocio dentro de WhatsApp.
- El producto se enfoca en respuestas automáticas, reservas, catálogo, soporte y registro de clientes; no en conversación abierta.
- Los usuarios principales son duenos/administradores y operadores de atencion.
- La accion mas critica del panel es configurar automatizaciones con rapidez y claridad.
- La interfaz debe sentirse operativa y sobria: herramienta de trabajo clara, densa y directa.
- El alcance base es pequeno negocio: una cuenta de WhatsApp, pocos usuarios internos y volumen moderado.
- La confiabilidad requerida es casi critica porque afecta la operacion diaria.

## Assumptions

- El frontend se construira como una nueva app con React, Vite, TypeScript, shadcn/ui y Tailwind CSS.
- El MVP incluira onboarding del negocio, conexion por QR, automatizaciones, catalogo, citas, historial basico y configuracion general.
- Metricas y usuarios/roles no seran protagonistas en esta primera version.
- La experiencia sera desktop-first con soporte movil funcional.
- Se usara un estandar serio de seguridad para datos de clientes e historial, sin definir aun requisitos regulatorios avanzados.
- Primero se validara UX y flujos con datos mock antes de integrar backend real.

## Non-Functional Requirements

- Performance: navegacion rapida y paneles editables sin demoras perceptibles en historiales y listas medianas.
- Scale: 1 cuenta de WhatsApp, 1 a 5 usuarios internos y cientos de conversaciones al mes.
- Security: acceso autenticado al panel, aislamiento de datos por negocio y proteccion de informacion de clientes.
- Reliability: estados de conexion, reglas activas y citas deben reflejarse de forma estable porque soportan operacion diaria.
- Maintenance: sistema de componentes simple, consistente y sin sobrearquitectura.

## Decision Log

1. Se decidio enfocar el producto en operacion de negocio por WhatsApp, no en conversacion generica.
   Alternativas consideradas: chatbot generalista, dashboard de metricas.
   Motivo: el valor real esta en ejecutar procesos del negocio.

2. Se eligio un MVP operativo.
   Alternativas consideradas: panel completo, solo direccion de marca/diseño.
   Motivo: reduce alcance sin perder valor utilizable.

3. Se tomo como usuario principal a dueno/admin y operador.
   Alternativas consideradas: solo dueno o solo operador.
   Motivo: el producto necesita servir tanto la configuracion inicial como el uso diario.

4. Se priorizo la configuracion de automatizaciones por encima de QR, metricas o historial.
   Alternativas consideradas: centrar valor en conexion o en monitoreo.
   Motivo: la automatizacion es el nucleo del producto.

5. Se eligio una direccion de interfaz de mesa de control operativa.
   Alternativas consideradas: panel por modulos, onboarding-first.
   Motivo: expresa mejor el trabajo diario y evita un dashboard SaaS generico.

6. Se definio una estrategia visual sobria con borders-only.
   Alternativas consideradas: sombras suaves, enfoque premium mas decorativo.
   Motivo: comunica herramienta tecnica y favorece claridad.

7. Se decidio representar automatizaciones como secuencias visibles de disparador a resultado.
   Alternativas consideradas: formularios largos de configuracion, tablas planas de reglas.
   Motivo: mejora comprension operativa y reduce carga cognitiva.

8. Se limito historial a trazabilidad operativa.
   Alternativas consideradas: bandeja completa tipo CRM/chat center.
   Motivo: evita diluir el MVP.

9. Se limito citas a agenda practica.
   Alternativas consideradas: suite completa de calendario.
   Motivo: mantener velocidad y foco.

## Domain Exploration

### Domain

- Centro de operaciones
- Bandeja de atencion
- Enrutamiento de consultas
- Turnos y reservas
- Catalogo transaccional
- Estado de conexion
- Reglas y automatizaciones
- Trazabilidad de interacciones

### Color World

- Grafito de consola
- Verde senal de WhatsApp
- Ambar de alerta operativa
- Marfil de papel de trabajo
- Acero mate de panel industrial
- Tinta azul gris para datos
- Rojo oxido para fallos criticos

### Signature

- Un mapa operativo donde cada automatizacion se presenta como secuencia visible: entrada, regla, accion y resultado, conectada al estado real de WhatsApp.

### Defaults Rejected

- Sidebar SaaS generico con cards de metricas arriba -> reemplazado por home de estado operativo.
- Paleta azul/morado estandar -> reemplazada por grafito, marfil y verde senal.
- Formularios largos de settings -> reemplazados por modulos densos y editables en contexto.

## Final Design

### Product Direction

La interfaz se define como una mesa de control operativa para pequenos negocios que manejan su atencion y procesos dentro de WhatsApp. El panel no gira alrededor de metricas ni de una bandeja de chat omnicanal; gira alrededor del estado de operacion y de la configuracion de automatizaciones.

### Navigation

- Resumen
- Automatizaciones
- Conexion QR
- Citas
- Catalogo
- Historial
- Configuracion

### Access Layer

Antes del panel debe existir una capa de acceso dedicada. La app se comporta como dos estados principales:

- `unauthenticated`
- `authenticated`

Mientras no haya sesion valida, el usuario solo ve el auth shell.

### Home / Resumen

La pantalla inicial muestra:

- Estado de conexion de WhatsApp
- Automatizaciones activas
- Citas proximas o pendientes
- Alertas operativas
- Checklist de onboarding hasta completar la configuracion minima

No se priorizan KPIs grandes. Las metricas solo aparecen como senales secundarias.

### Core Module: Automatizaciones

El centro del producto es un editor de automatizaciones basado en secuencias visibles. Cada flujo debe mostrar:

- Disparador
- Condicion opcional
- Accion
- Resultado esperado

La vista recomendada en desktop es maestro-detalle:

- Lista de flujos a la izquierda
- Detalle editable a la derecha

La edicion debe hacerse con bloques compactos, editables inline y conectados visualmente.

### Supporting Modules

#### Conexion QR

- Estado actual
- QR grande cuando sea necesario
- Ultima sincronizacion
- Telefono conectado
- Acciones de reconexion o reemplazo de sesion

#### Citas

- Agenda del dia
- Disponibilidad por bloques
- Confirmaciones pendientes

#### Catalogo

- Tabla o fichas densas
- Nombre, precio, disponibilidad, categoria y visibilidad en WhatsApp

#### Historial

- Cliente
- Motivo de contacto
- Automatizacion activada
- Resultado
- Fecha

#### Configuracion

- Perfil del negocio
- Horarios de atencion
- Mensaje de bienvenida
- Ajustes generales

### Auth Shell

El acceso no se presenta como modal ni como formulario generico aislado. Debe ser una pantalla completa con dos zonas:

- Columna de contexto de producto
- Columna de formulario activo

En desktop se recomienda una division aproximada 45/55. En movil se colapsa a una sola columna con el contexto arriba.

#### Modes

- Entrar
- Crear cuenta

#### Login

- Email
- Contrasena
- CTA principal: `Entrar`
- CTA secundaria: `¿Olvidaste tu contrasena?`
- Cambio visible hacia `Crear cuenta`

#### Register

- Name (opcional)
- Phone (opcional)
- Email
- Contrasena
- Confirmar contrasena
- CTA principal: `Crear cuenta`

#### Registration behavior

- Si el registro es exitoso, la sesion se crea automaticamente y el usuario entra directo al panel.
- Si el email ya existe, el mensaje debe ofrecer recuperar acceso.

#### Validation and states

- Email obligatorio y valido
- Contrasena minima de 8 caracteres
- Confirmacion identica a la contrasena
- Telefono y name opcionales, pero validados si se informan

Estados obligatorios:

- idle
- submitting
- validation error
- server error
- network error
- session persisted
- session expired

## Interface System

- Intent: herramienta operativa para dueno y operador; debe sentirse clara, directa y confiable.
- Palette: grafito, marfil, verde senal, ambar y rojo oxido.
- Depth: borders-only.
- Surfaces: cambios minimos de luminosidad, sin saltos bruscos.
- Typography: sans con personalidad tecnica y legibilidad alta.
- Spacing base: 8px.

### Auth UI Notes

- El login debe sentirse de la misma familia del panel, pero con mayor claridad y menos densidad visual.
- El conmutador `Entrar / Crear cuenta` debe ser evidente y no depender de un texto secundario perdido.
- El lado contextual debe reforzar que se entra a una herramienta de operacion por WhatsApp, no a una app generica.

## Implementation Handoff

### Recommended stack usage

- React + Vite + TypeScript para la aplicacion
- shadcn/ui como primitives, no como apariencia final
- Tailwind CSS con tokens propios

### Core components

- AppShell
- AuthLayout
- AuthTabs
- LoginForm
- RegisterForm
- AuthStatusAlert
- OperationalStatus
- OnboardingChecklist
- AutomationList
- AutomationFlowCard
- QrConnectionPanel
- AppointmentsBoard
- CatalogTable
- InteractionLog
- SettingsSections

### Risks

- Mezclar autenticacion con onboarding demasiado pronto
- Mensajes ambiguos entre errores de validacion, red y credenciales
- No prever expiracion de sesion o recuperacion de acceso
- Convertir automatizaciones en un builder excesivamente complejo
- Expandir historial a CRM completo demasiado pronto
- Sobrecargar citas con demasiadas vistas

### Suggested implementation phases

1. Base del proyecto y design tokens
2. Shell de aplicacion y navegacion
3. Resumen operativo y checklist de onboarding
4. Modulo de automatizaciones con datos mock
5. Conexion QR, citas y catalogo
6. Historial y configuracion
7. Integracion de datos reales y validacion de UX
