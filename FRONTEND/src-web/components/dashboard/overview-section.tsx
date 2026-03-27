import { Activity, CalendarClock, LoaderCircle, PackageSearch, RadioTower } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { getAppointments, type AppointmentView } from "@/lib/appointments";
import { getAutomationMainFlow } from "@/lib/automation-main-flow";
import { getInboxConversations, type InboxConversation } from "@/lib/message-inbox";
import { getProducts } from "@/lib/products";
import { getWhatsappSession } from "@/lib/whatsapp-session";
import type { AuthUser } from "@/types/auth";

function formatDateTime(date: string, time: string) {
  const dateValue = new Date(date);
  const timeValue = new Date(time);
  const datePart = Number.isNaN(dateValue.getTime())
    ? date
    : new Intl.DateTimeFormat("es-EC", { day: "2-digit", month: "short" }).format(dateValue);
  const timePart = Number.isNaN(timeValue.getTime())
    ? time
    : new Intl.DateTimeFormat("es-EC", { hour: "2-digit", minute: "2-digit", hour12: false }).format(timeValue);
  return `${datePart} Ã‚Â· ${timePart}`;
}

export function OverviewSection({ sessionUser }: { sessionUser: AuthUser }) {
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<AppointmentView[]>([]);
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [productsCount, setProductsCount] = useState(0);
  const [activeAutomations, setActiveAutomations] = useState(0);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [whatsappState, setWhatsappState] = useState<string>("Sin sesion");

  useEffect(() => {
    let active = true;

    const load = async () => {
      const token = getAccessToken();
      if (!token) {
        if (!active) return;
        setLoading(false);
        setError("Entra de nuevo para ver el resumen de tu negocio.");
        return;
      }

      const [appointmentsResult, conversationsResult, productsResult, automationResult, sessionResult] = await Promise.all([
        getAppointments(token),
        getInboxConversations(token),
        getProducts(token),
        getAutomationMainFlow(token),
        getWhatsappSession(token),
      ]);
      if (!active) return;

      const firstError = [appointmentsResult, conversationsResult, productsResult, automationResult, sessionResult].find((result) => !result.ok);
      if (firstError && !firstError.ok) {
        setError(firstError.message);
        setLoading(false);
        return;
      }

      if (!appointmentsResult.ok || !conversationsResult.ok || !productsResult.ok || !automationResult.ok || !sessionResult.ok) {
        setError("No pudimos cargar el resumen de tu negocio.");
        setLoading(false);
        return;
      }

      setAppointments(appointmentsResult.data);
      setConversations(conversationsResult.data);
      setProductsCount(productsResult.data.filter((item) => item.isActive).length);
      setActiveAutomations(automationResult.flow.quickAutomations.filter((item) => item.enabled).length);
      setLocationEnabled(Boolean(automationResult.flow.quickAutomations.find((item) => item.key === "location")?.enabled));
      setWhatsappState(sessionResult.session.status === "connected" ? "Conectada" : sessionResult.session.status === "pending" ? "Esperando QR" : sessionResult.session.status === "paused" ? "Pausada" : sessionResult.session.status === "expired" ? "Vencida" : "Desconectada");
      setError(null);
      setLoading(false);
    };

    void load();

    return () => {
      active = false;
    };
  }, [getAccessToken]);

  const businessName = sessionUser.business?.name?.trim() || "Sin configurar";
  const today = new Date().toISOString().slice(0, 10);
  const todaysAppointments = useMemo(
    () => appointments.filter((item) => item.appointmentDate.slice(0, 10) === today),
    [appointments, today],
  );
  const pendingAppointments = useMemo(
    () => appointments.filter((item) => item.status === "pending" || item.status === "confirmed").slice(0, 4),
    [appointments],
  );
  const recentConversations = conversations.slice(0, 4);

  if (loading) {
    return (
      <Card className="border-border/80 bg-card shadow-[0_18px_60px_rgba(18,25,36,0.06)]">
        <CardContent className="flex min-h-[280px] items-center justify-center gap-3 text-muted-foreground">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          <span>Cargando el resumen de tu negocio...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_340px]">
      <div className="grid gap-6">
        <Card className="bg-card/95">
          <CardHeader>
            <CardDescription>Estado actual</CardDescription>
            <CardTitle>Resumen del negocio</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { icon: RadioTower, label: "Conexion WhatsApp", value: whatsappState, detail: sessionUser.email },
              { icon: CalendarClock, label: "Citas para hoy", value: String(todaysAppointments.length), detail: `${pendingAppointments.length} activas o por confirmar` },
              { icon: PackageSearch, label: "Productos visibles", value: String(productsCount), detail: "Listo para compartir por WhatsApp" },
              { icon: Activity, label: "Flujos activos", value: String(activeAutomations), detail: locationEnabled ? "Ubicacion lista para compartir" : "Ubicacion todavia inactiva" },
            ].map((item) => {
              const isWhatsappCard = item.label === "Conexion WhatsApp";
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-lg border border-border px-4 py-4">
                  <div className="flex min-w-0 items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="min-w-0 break-words leading-4">{item.label}</span>
                  </div>
                  <p className={isWhatsappCard ? "mt-3 min-w-0 break-words text-2xl font-semibold leading-tight text-panel-ink" : "mt-3 text-2xl font-semibold text-panel-ink"}>{item.value}</p>
                  <p className={isWhatsappCard ? "mt-2 min-w-0 break-all text-sm leading-5 text-muted-foreground" : "mt-2 text-sm text-muted-foreground"}>{item.detail}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {error ? (
          <div className="rounded-2xl border border-rose-300/80 bg-rose-100/85 px-4 py-3 text-sm text-rose-950">
            {error}
          </div>
        ) : null}

        <Card className="bg-card/95">
          <CardHeader>
            <CardDescription>Agenda inmediata</CardDescription>
            <CardTitle>Proximas citas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {pendingAppointments.length ? pendingAppointments.map((appointment) => (
              <div key={appointment.id} className="rounded-lg border border-border px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-panel-ink">{appointment.customer?.name?.trim() || appointment.customer?.phone || "Cliente sin nombre"}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{appointment.description?.trim() || "Sin descripcion registrada."}</p>
                  </div>
                  <Badge variant={appointment.status === "confirmed" ? "success" : "warning"}>
                    {appointment.status === "confirmed" ? "Confirmada" : "Pendiente"}
                  </Badge>
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">{formatDateTime(appointment.appointmentDate, appointment.appointmentTime)}</p>
              </div>
            )) : (
              <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                Todavia no tienes citas activas para mostrar.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card className="bg-card/95">
          <CardHeader>
            <CardDescription>Negocio</CardDescription>
            <CardTitle>{businessName}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-lg border border-border px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Cuenta activa</p>
              <p className="mt-2 text-sm font-medium text-panel-ink">{sessionUser.email}</p>
            </div>
            <div className="rounded-lg border border-border px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Clientes con historial</p>
              <p className="mt-2 text-2xl font-semibold text-panel-ink">{conversations.length}</p>
            </div>
            <div className="rounded-lg border border-border px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Actividad reciente</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {locationEnabled
                  ? "El bot ya puede compartir la ubicacion configurada del negocio."
                  : "Activa la automatizacion de ubicacion para compartir el mapa por WhatsApp."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/95">
          <CardHeader>
            <CardDescription>Actividad reciente</CardDescription>
            <CardTitle>Ultimas conversaciones</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {recentConversations.length ? recentConversations.map((conversation) => (
              <div key={conversation.customerId} className="rounded-lg border border-border px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-panel-ink">{conversation.customerName || conversation.phone}</p>
                  <Badge variant={conversation.lastDirection === "outbound" ? "success" : "default"}>
                    {conversation.lastDirection === "outbound" ? "Bot" : "Cliente"}
                  </Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{conversation.lastMessage}</p>
              </div>
            )) : (
              <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                Todavia no tienes mensajes guardados.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}









