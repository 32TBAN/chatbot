import {
  Activity,
  Bot,
  Bug,
  CalendarClock,
  MessageSquareShare,
  PackageSearch,
  QrCode,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { NavItem } from "@/types/dashboard";

export const navItems: readonly NavItem[] = [
  { id: "overview", label: "Resumen", shortLabel: "Resumen", icon: Activity },
  {
    id: "automations",
    label: "Automatizaciones",
    shortLabel: "Automatiz.",
    icon: Bot,
  },
  { id: "qr", label: "Conexion QR", shortLabel: "QR", icon: QrCode },
  { id: "appointments", label: "Citas", shortLabel: "Citas", icon: CalendarClock },
  { id: "catalog", label: "Catalogo", shortLabel: "Catalogo", icon: PackageSearch },
  {
    id: "history",
    label: "Historial",
    shortLabel: "Historial",
    icon: MessageSquareShare,
  },
  {
    id: "settings",
    label: "Configuracion",
    shortLabel: "Config",
    icon: ShieldCheck,
  },
  {
    id: "debug",
    label: "Debug",
    shortLabel: "Debug",
    icon: Bug,
  },
] as const;

export const statusCards = [
  {
    label: "Conexion WhatsApp",
    value: "Activa",
    detail: "Sesion enlazada hace 4 min",
    tone: "success" as const,
  },
  {
    label: "Flujos activos",
    value: "12",
    detail: "3 requieren revision",
    tone: "warning" as const,
  },
  {
    label: "Citas de hoy",
    value: "08",
    detail: "2 por confirmar",
    tone: "default" as const,
  },
  {
    label: "Clientes",
    value: "184",
    detail: "14 nuevos esta semana",
    tone: "default" as const,
  },
] as const;

export const onboardingSteps = [
  { title: "Conectar numero principal", detail: "QR verificado y sesion persistente", done: true },
  { title: "Configurar bienvenida", detail: "Mensaje activo en la primera respuesta", done: true },
  { title: "Publicar primer flujo", detail: "Reservas y soporte basico activos", done: true },
  { title: "Definir horarios", detail: "Faltan bloques de sabado", done: false },
  { title: "Cargar catalogo base", detail: "3 productos aun sin visibilidad", done: false },
] as const;

export const automations = [
  {
    name: "Reserva inicial",
    status: "Activa",
    trigger: "Cliente escribe reservar o cita",
    condition: "Horario laboral y cupos disponibles",
    action: "Ofrecer bloques del dia y capturar datos",
    result: "Cita creada con confirmacion automatica",
    volume: "24 ejecuciones hoy",
  },
  {
    name: "Consulta de productos",
    status: "Revision",
    trigger: "Cliente pregunta precio, catalogo o stock",
    condition: "Categoria detectada por palabra clave",
    action: "Enviar ficha breve y CTA a asesor",
    result: "Producto mostrado y lead etiquetado",
    volume: "17 ejecuciones hoy",
  },
  {
    name: "Desvio a soporte",
    status: "Activa",
    trigger: "Cliente reporta falla o soporte",
    condition: "Falla repetida o tono de urgencia",
    action: "Recopilar problema y escalar a operador",
    result: "Ticket interno y respuesta de espera",
    volume: "6 ejecuciones hoy",
  },
] as const;

export const appointments = [
  { time: "09:00", client: "Carlos Mena", reason: "Demo de automatizacion", state: "Confirmada" },
  { time: "10:30", client: "Farmacia Norte", reason: "Ajuste de horarios", state: "Pendiente" },
  { time: "14:00", client: "Pamela Ruiz", reason: "Catalogo de productos", state: "Confirmada" },
  { time: "16:00", client: "Tienda Delta", reason: "Capacitacion operador", state: "Pendiente" },
] as const;

export const catalogItems = [
  { name: "Plan Basico", category: "Automatizacion", price: "$39", visibility: "Visible", stock: "Digital" },
  { name: "Plan Reservas", category: "Agenda", price: "$59", visibility: "Visible", stock: "Digital" },
  { name: "Soporte Prioritario", category: "Servicio", price: "$89", visibility: "Oculto", stock: "Bajo pedido" },
] as const;

export const interactions = [
  {
    customer: "Andrea V.",
    reason: "Reserva de cita",
    automation: "Reserva inicial",
    outcome: "Cita confirmada para 11 Mar",
    time: "Hace 8 min",
  },
  {
    customer: "Comercial Rios",
    reason: "Consulta de stock",
    automation: "Consulta de productos",
    outcome: "Lead enviado a operador",
    time: "Hace 16 min",
  },
  {
    customer: "Jorge Molina",
    reason: "Soporte tecnico",
    automation: "Desvio a soporte",
    outcome: "Ticket escalado",
    time: "Hace 34 min",
  },
] as const;

export const metrics = [
  { label: "Respuestas automaticas", value: "68%", change: "+4%" },
  { label: "Tiempo a operador", value: "2m 10s", change: "-18s" },
  { label: "Conversion a cita", value: "21%", change: "+3%" },
] as const;

export const teamSnapshot = [
  { name: "Admin principal", role: "Owner", coverage: "Configuracion general" },
  { name: "Laura P.", role: "Operadora", coverage: "Citas y soporte" },
  { name: "Marco T.", role: "Operador", coverage: "Catalogo y ventas" },
] as const;

export const headerStats = [
  { label: "Numero conectado", value: "+593 99 431 2281" },
  { label: "Plantillas activas", value: "12" },
  { label: "Registros hoy", value: "14" },
  { label: "Operadores", value: `${teamSnapshot.length}` },
] as const;

export const pageTitles = {
  overview: {
    eyebrow: "Centro de operaciones",
    title: "Estado operativo del negocio",
    description:
      "Controla conexion, flujos, agenda y trazabilidad desde un solo panel.",
  },
  automations: {
    eyebrow: "Automatizaciones",
    title: "Flujos activos e intervenciones",
    description:
      "Cada bloque conecta la intencion del cliente con una accion del negocio.",
  },
  qr: {
    eyebrow: "Canal conectado",
    title: "Sesion WhatsApp y estado del enlace",
    description:
      "Monitorea la sesion, reconecta rapido y evita caidas en la operacion.",
  },
  appointments: {
    eyebrow: "Agenda operativa",
    title: "Horarios y confirmaciones",
    description:
      "Organiza bloques de atencion y detecta fricciones antes de afectar la agenda.",
  },
  catalog: {
    eyebrow: "Catalogo utilitario",
    title: "Productos visibles para ventas",
    description:
      "Gestiona fichas, visibilidad y relacion con las automatizaciones.",
  },
  history: {
    eyebrow: "Trazabilidad",
    title: "Interacciones recientes",
    description:
      "Sigue lo ocurrido, el flujo activado y si hubo intervencion manual.",
  },
  settings: {
    eyebrow: "Configuracion base",
    title: "Reglas y parametros generales",
    description:
      "Define horarios, mensajes base y responsables sin volver pesado el panel.",
  },
  debug: {
    eyebrow: "Pruebas controladas",
    title: "Debug de mensajes del bot",
    description:
      "Simula un inbound desde el panel antes de usar el canal real.",
  },
};

export const settingsGroups = [
  { title: "Perfil del negocio", detail: "Nombre comercial, zona horaria y canal principal" },
  { title: "Horarios de atencion", detail: "Bloques activos y dias no laborables" },
  { title: "Mensaje de bienvenida", detail: "Primer contacto y expectativa de respuesta" },
  { title: "Roles operativos", detail: "Acceso a citas, catalogo y soporte" },
] as const;

export const overviewHighlights = [
  {
    title: "Operacion estable",
    text: "WhatsApp conectado, flujos principales activos y cola sin incidentes criticos.",
  },
  {
    title: "Puntos de revision",
    text: "El flujo de productos requiere mejor cobertura para stock y promociones.",
  },
] as const;

export const qrStats = [
  { label: "Estado", value: "Sesion activa" },
  { label: "Ultima sincronizacion", value: "09 Mar 2026, 08:46" },
  { label: "Dispositivo", value: "Samsung Business A54" },
  { label: "Fallback manual", value: "Disponible" },
] as const;

export const automationHealth = [
  { label: "Cobertura FAQ", value: 78 },
  { label: "Reserva automatizada", value: 91 },
  { label: "Catalogo consultable", value: 63 },
] as const;

export const overviewActions = [
  "Editar flujo de reservas",
  "Completar horarios sabado",
  "Publicar productos ocultos",
] as const;

export const overviewRosterIcon = Users;
