import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import {
  getWhatsappSession,
  simulateWhatsappDebugInbound,
  type DebugConversationResult,
  type WhatsappSessionView,
} from "@/lib/whatsapp-session";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" }> = {
  pending: { label: "Esperando QR", variant: "warning" },
  connected: { label: "Conectada", variant: "success" },
  paused: { label: "Pausada", variant: "default" },
  disconnected: { label: "Desconectada", variant: "destructive" },
  expired: { label: "Vencida", variant: "destructive" },
};

function formatDate(value: string | null) {
  if (!value) return "Sin registro";

  try {
    return new Date(value).toLocaleString("es-EC", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

export function DebugSection({ isOwner }: { isOwner: boolean }) {
  const { getAccessToken } = useAuth();
  const [session, setSession] = useState<WhatsappSessionView | null>(null);
  const [conversation, setConversation] = useState<DebugConversationResult | null>(null);
  const [draft, setDraft] = useState("");
  const [loadingSession, setLoadingSession] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const token = getAccessToken();
      if (!token) {
        if (!active) return;
        setLoadingSession(false);
        setError("No hay una sesion autenticada para usar el debug.");
        return;
      }

      setLoadingSession(true);
      const result = await getWhatsappSession(token);
      if (!active) return;

      if (!result.ok) {
        setError(result.message);
        setSession(null);
      } else {
        setError(null);
        setSession(result.session);
      }

      setLoadingSession(false);
    };

    void load();
    return () => {
      active = false;
    };
  }, [getAccessToken]);

  const isSessionReady = session?.status === "connected" && session.isRuntimeActive;

  const clearDebugView = () => {
    setConversation(null);
    setDraft("");
    setError(null);
    setStatus(null);
  };

  const runSimulation = async () => {
    const token = getAccessToken();
    if (!token) {
      setError("No hay una sesion autenticada para usar el debug.");
      return;
    }

    if (!draft.trim()) {
      setError("Escribe un mensaje de prueba antes de ejecutar el debug.");
      return;
    }

    setRunning(true);
    setError(null);
    setStatus(null);

    const result = await simulateWhatsappDebugInbound(token, {
      content: draft,
      messageType: "text",
    });

    setRunning(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setConversation(result.conversation);
    setStatus("Prueba ejecutada. La conversacion de debug ya deberia estar visible en Historial.");
  };

  if (!isOwner) {
    return (
      <Card className="bg-card/95">
        <CardContent className="px-6 py-8 text-sm text-muted-foreground">
          Solo el owner del negocio puede usar esta seccion de debug.
        </CardContent>
      </Card>
    );
  }

  const statusMeta = session?.status ? STATUS_LABELS[session.status] : null;

  return (
    <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className="grid gap-6">
        <Card className="bg-card/95">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardDescription>Prerequisito real</CardDescription>
                <CardTitle>Sesion WhatsApp para debug</CardTitle>
              </div>
              {statusMeta ? <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge> : <Badge variant="default">Sin sesion</Badge>}
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            <Detail label="Numero activo" value={session?.phoneNumber ?? "No disponible"} />
            <Detail label="Runtime en memoria" value={session?.isRuntimeActive ? "Activo" : "Inactivo"} />
            <Detail label="Ultima actividad" value={formatDate(session?.lastSeenAt ?? null)} />
            <p className="rounded-lg border border-border bg-muted/20 px-4 py-4 text-muted-foreground">
              Este debug inyecta un inbound de prueba dentro del backend usando la misma logica de respuestas del bot.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/95">
          <CardHeader>
            <CardDescription>Entrada de prueba</CardDescription>
            <CardTitle>Simular mensaje entrante</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Preparado para texto ahora, extensible a imagen, video y PDF despues.
            </div>
            <textarea
              className="min-h-[180px] w-full rounded-md border border-input bg-muted/45 px-3 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50"
              disabled={loadingSession || running || !isSessionReady}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ej. hola\n\nQuiero saber los planes disponibles"
              value={draft}
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {status ? <p className="text-sm text-success">{status}</p> : null}
            {!loadingSession && !isSessionReady ? (
              <p className="text-sm text-muted-foreground">
                Necesitas una sesion conectada y activa en memoria para ejecutar el debug.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Button disabled={!conversation && !draft && !error && !status} onClick={clearDebugView} type="button" variant="secondary">
                Limpiar prueba
              </Button>
              <Button disabled={loadingSession || running || !isSessionReady} onClick={() => void runSimulation()} type="button">
                {running ? "Ejecutando prueba..." : "Ejecutar debug"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/95">
        <CardHeader>
          <CardDescription>Resultado</CardDescription>
          <CardTitle>Conversacion de prueba</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {loadingSession ? <p className="text-sm text-muted-foreground">Cargando estado real de la sesion...</p> : null}

          {conversation?.customer ? (
            <div className="grid gap-4">
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/15 px-4 py-4">
                <div>
                  <p className="text-sm font-medium text-panel-ink">{conversation.customer.name || conversation.customer.phone}</p>
                  <p className="text-sm text-muted-foreground">{conversation.customer.phone}</p>
                </div>
                <Badge variant="warning">Prueba</Badge>
              </div>

              <div className="overflow-hidden rounded-[1.4rem] border border-border/70 bg-[linear-gradient(180deg,rgba(243,247,242,0.92),rgba(253,251,245,0.96))]">
                <div className="grid max-h-[min(60vh,540px)] gap-3 overflow-y-auto p-4">
                  {conversation.messages.map((message) => (
                    <div className={cn("flex", message.direction === "outbound" ? "justify-end" : "justify-start")} key={message.id}>
                      <div className={cn("max-w-[82%] rounded-[1.4rem] px-4 py-3 text-sm leading-6 shadow-sm", message.direction === "outbound" ? "bg-panel-ink text-panel-ivory" : "border border-border/80 bg-background/92 text-panel-ink")}>
                        <p className={cn("text-[11px] uppercase tracking-[0.24em]", message.direction === "outbound" ? "text-panel-ivory/70" : "text-muted-foreground")}>
                          {message.direction === "outbound" ? "Bot" : "Debug inbound"}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap">{message.content}</p>
                        <p className={cn("mt-2 text-[11px]", message.direction === "outbound" ? "text-panel-ivory/70" : "text-muted-foreground")}>
                          {formatDate(message.sentAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid min-h-[420px] place-items-center rounded-lg border border-dashed border-border bg-muted/10 px-6 text-center text-sm text-muted-foreground">
              Ejecuta una prueba para ver aqui la conversacion simulada y validar la respuesta automatica.
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/15 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm text-panel-ink">{value}</p>
    </div>
  );
}