# Interface Design System

## Direction

- Product feel: mesa de control operativa
- Audience: dueno/admin y operador de atencion
- Primary job: configurar y supervisar automatizaciones de negocio por WhatsApp
- Tone: sobrio, tecnico, directo, confiable

## Domain

- Centro de operaciones
- Estado de conexion
- Automatizaciones
- Agenda operativa
- Trazabilidad
- Catalogo transaccional

## Palette

- `--graphite`: base tecnica principal
- `--ivory`: superficie de trabajo
- `--signal-green`: conexion y estado sano
- `--amber-alert`: advertencias
- `--oxide-red`: fallos criticos
- `--steel`: bordes y estructura
- `--ink-blue-gray`: datos secundarios

## Depth Strategy

- Approach: `borders-only`
- Sidebar: mismo mundo visual que el contenido, separado por borde sutil
- Surfaces: diferencias leves de luminosidad, sin sombras decorativas
- Controls: fondos ligeramente mas hundidos que su contenedor

## Typography

- Titles: sans de caracter tecnico, ligeramente condensada si encaja con el sistema elegido
- UI/body: sans neutra, legible y densa
- Data: numeros tabulares cuando haya estados, conteos o agenda

## Spacing

- Base unit: `8px`
- Compact rhythm para tablas, listas operativas y bloques de automatizacion

## Key Patterns

- Auth shell dedicado antes del panel, no modal
- Acceso en dos modos claros: entrar y crear cuenta
- Columna izquierda de contexto de producto y columna derecha de formulario en desktop
- Estados de error, carga y recuperacion visibles y sobrios
- Home centrado en estado operativo, no en grandes KPIs
- Modulo principal de automatizaciones con estructura maestro-detalle
- Automatizaciones representadas como secuencias visibles de disparador -> accion -> resultado
- Onboarding como checklist persistente hasta completar setup minimo
- Historial limitado a trazabilidad operativa
- Citas limitadas a agenda practica

## Anti-Patterns

- Pantalla de login generica sin contexto de producto
- Modal de acceso encima del panel como solucion principal
- Errores de auth ambiguos o sin salida clara a recuperacion
- Dashboard SaaS generico con metricas como protagonista
- Paleta azul/morado estandar
- Formularios largos y dispersos para configurar reglas
- Sombras vistosas o superficies demasiado decorativas
