import {
  Activity,
  Bot,
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
    label: "Respuestas automaticas",
    shortLabel: "Respuestas",
    icon: Bot,
  },
  { id: "qr", label: "Conectar WhatsApp", shortLabel: "WhatsApp", icon: QrCode },
  { id: "appointments", label: "Citas", shortLabel: "Citas", icon: CalendarClock },
  { id: "catalog", label: "Catalogo", shortLabel: "Catalogo", icon: PackageSearch },
  {
    id: "history",
    label: "Conversaciones",
    shortLabel: "Historial",
    icon: MessageSquareShare,
  },
  {
    id: "settings",
    label: "Tu negocio",
    shortLabel: "Negocio",
    icon: ShieldCheck,
  },
] as const;

export const statusCards = [
  {
    label: "WhatsApp conectado",
    value: "Activa",
    detail: "Todo listo para seguir atendiendo",
    tone: "success" as const,
  },
  {
    label: "Respuestas activas",
    value: "12",
    detail: "3 necesitan revision",
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
  { title: "Conecta tu numero principal", detail: "QR escaneado y WhatsApp listo", done: true },
  { title: "Activa tu bienvenida", detail: "Tu primer mensaje ya responde solo", done: true },
  { title: "Publica tu primer flujo", detail: "Reservas y preguntas frecuentes activas", done: true },
  { title: "Define tus horarios", detail: "Todavia faltan los bloques del sabado", done: false },
  { title: "Carga tu catalogo base", detail: "Hay 3 productos aun sin publicar", done: false },
] as const;

export const automations = [
  {
    name: "Reserva inicial",
    status: "Activa",
    trigger: "Cliente escribe reservar o cita",
    condition: "Horario laboral y cupos disponibles",
    action: "Ofrecer horarios del dia y pedir los datos",
    result: "Cita creada con confirmacion automatica",
    volume: "24 usos hoy",
  },
  {
    name: "Consulta de productos",
    status: "Revision",
    trigger: "Cliente pregunta precio, catalogo o stock",
    condition: "Categoria detectada por palabra clave",
    action: "Enviar una ficha breve y pasar a un asesor si hace falta",
    result: "Producto mostrado y cliente identificado",
    volume: "17 usos hoy",
  },
  {
    name: "Ayuda y soporte",
    status: "Activa",
    trigger: "Cliente reporta un problema o pide ayuda",
    condition: "Urgencia detectada o consulta repetida",
    action: "Pedir contexto y avisar al responsable",
    result: "Caso registrado y respuesta de seguimiento",
    volume: "6 usos hoy",
  },
] as const;

export const appointments = [
  { time: "09:00", client: "Carlos Mena", reason: "Demo de automatizacion", state: "Confirmada" },
  { time: "10:30", client: "Farmacia Norte", reason: "Ajuste de horarios", state: "Pendiente" },
  { time: "14:00", client: "Pamela Ruiz", reason: "Catalogo de productos", state: "Confirmada" },
  { time: "16:00", client: "Tienda Delta", reason: "Capacitacion del equipo", state: "Pendiente" },
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
    outcome: "Consulta enviada a un asesor",
    time: "Hace 16 min",
  },
  {
    customer: "Jorge Molina",
    reason: "Soporte tecnico",
    automation: "Ayuda y soporte",
    outcome: "Caso derivado",
    time: "Hace 34 min",
  },
] as const;

export const metrics = [
  { label: "Respuestas automaticas", value: "68%", change: "+4%" },
  { label: "Tiempo hasta un asesor", value: "2m 10s", change: "-18s" },
  { label: "Conversion a cita", value: "21%", change: "+3%" },
] as const;

export const teamSnapshot = [
  { name: "Admin principal", role: "Owner", coverage: "Vista general del negocio" },
  { name: "Laura P.", role: "Operadora", coverage: "Citas y soporte" },
  { name: "Marco T.", role: "Operador", coverage: "Catalogo y ventas" },
] as const;

export const headerStats = [
  { label: "Numero conectado", value: "+593 99 431 2281" },
  { label: "Respuestas activas", value: "12" },
  { label: "Contactos hoy", value: "14" },
  { label: "Personas del equipo", value: `${teamSnapshot.length}` },
] as const;

export const pageTitles = {
  overview: {
    eyebrow: "Tu negocio hoy",
    title: "Asi va tu atencion por WhatsApp",
    description:
      "Mira rapidamente si tu numero esta conectado, como van tus respuestas y que necesita atencion hoy.",
  },
  automations: {
    eyebrow: "Respuestas automaticas",
    title: "Configura como responde tu negocio",
    description:
      "Crea mensajes utiles para las preguntas mas comunes y prueba como responderia tu negocio.",
  },
  qr: {
    eyebrow: "Conecta tu numero",
    title: "Estado de tu WhatsApp",
    description:
      "Escanea el QR, revisa si tu numero sigue conectado y vuelve a enlazarlo cuando haga falta.",
  },
  appointments: {
    eyebrow: "Agenda",
    title: "Ordena tus citas del dia",
    description:
      "Confirma horarios, mueve pendientes y evita que se te pase una reserva importante.",
  },
  catalog: {
    eyebrow: "Catalogo",
    title: "Muestra lo que vendes",
    description:
      "Organiza tus productos o servicios para responder mas rapido cuando un cliente pregunte.",
  },
  history: {
    eyebrow: "Conversaciones",
    title: "Revisa lo ultimo que hablaron tus clientes",
    description:
      "Consulta mensajes recientes, respuestas del bot y conversaciones que necesitan seguimiento.",
  },
  settings: {
    eyebrow: "Tu negocio",
    title: "Prepara la base de tu cuenta",
    description:
      "Completa los datos principales, horarios y mensajes base para que todo funcione mejor desde el inicio.",
  },
};

export const settingsGroups = [
  { title: "Datos del negocio", detail: "Nombre, contacto y datos principales" },
  { title: "Horarios de atencion", detail: "Dias y horas en las que respondes" },
  { title: "Mensaje de bienvenida", detail: "Primer mensaje que recibe tu cliente" },
  { title: "Accesos del equipo", detail: "Quien ve citas, catalogo y conversaciones" },
] as const;

export const overviewHighlights = [
  {
    title: "Todo bajo control",
    text: "Tu WhatsApp esta conectado, las respuestas principales siguen activas y no hay alertas urgentes.",
  },
  {
    title: "Oportunidades de mejora",
    text: "Tu flujo de productos todavia puede responder mejor sobre stock y promociones.",
  },
] as const;

export const qrStats = [
  { label: "Estado", value: "WhatsApp activo" },
  { label: "Ultima revision", value: "09 Mar 2026, 08:46" },
  { label: "Telefono", value: "Samsung Business A54" },
  { label: "Reconectar", value: "Disponible" },
] as const;

export const automationHealth = [
  { label: "Preguntas frecuentes cubiertas", value: 78 },
  { label: "Reservas automatizadas", value: 91 },
  { label: "Catalogo listo para consultar", value: 63 },
] as const;

export const overviewActions = [
  "Mejorar el flujo de reservas",
  "Completar horarios del sabado",
  "Publicar productos ocultos",
] as const;

export const overviewRosterIcon = Users;
