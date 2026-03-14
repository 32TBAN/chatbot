import { useEffect, useRef, useState } from "react";
import { LoaderCircle, LogOut, Pause, Play, QrCode, RefreshCw, Smartphone } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import {
  activateWhatsappSession,
  getWhatsappSession,
  logoutWhatsappSession,
  pauseWhatsappSession,
  type WhatsappSessionStatus,
  type WhatsappSessionView,
} from "@/lib/whatsapp-session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const POLL_INTERVAL_MS = 4000;

const STATUS_COPY: Record<WhatsappSessionStatus, { label: string; variant: "default" | "success" | "warning" | "destructive" }> = {
  pending: { label: "Esperando escaneo", variant: "warning" },
  connected: { label: "Conectada", variant: "success" },
  paused: { label: "Pausada", variant: "default" },
  disconnected: { label: "Sin enlace", variant: "destructive" },
  expired: { label: "Credenciales vencidas", variant: "destructive" },
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

function shouldAutoActivate(currentSession: WhatsappSessionView | null) {
  if (!currentSession) return true;
  if (currentSession.status === "connected") return false;
  if (currentSession.status === "pending" && currentSession.qrCode) return false;
  return true;
}

export function QrSection() {
  const { getAccessToken } = useAuth();
  const [session, setSession] = useState<WhatsappSessionView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [actionBusy, setActionBusy] = useState<"activate" | "pause" | "logout" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasAutoActivatedRef = useRef(false);
  const skipNextAutoActivateRef = useRef(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setIsLoading(false);
      setError("No hay una sesion autenticada para conectar WhatsApp.");
      return;
    }

    let cancelled = false;

    const autoActivate = async () => {
      if (hasAutoActivatedRef.current || skipNextAutoActivateRef.current) {
        return;
      }

      hasAutoActivatedRef.current = true;
      setIsGeneratingQr(true);

      const activationResult = await activateWhatsappSession(token);
      if (cancelled) return;

      if (!activationResult.ok) {
        setError(activationResult.message);
        setIsGeneratingQr(false);
        return;
      }

      setSession(activationResult.session);
      setError(null);
      setIsGeneratingQr(
        !activationResult.session.qrCode && activationResult.session.status !== "connected",
      );
    };

    const load = async (silent = false) => {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const result = await getWhatsappSession(token);
      if (cancelled) return;

      if (!result.ok) {
        setError(result.message);
        setIsGeneratingQr(false);
      } else {
        setSession(result.session);
        setError(null);
        setIsGeneratingQr(!result.session.qrCode && result.session.status !== "connected");

        if (shouldAutoActivate(result.session)) {
          await autoActivate();
        }
      }

      setIsLoading(false);
      setIsRefreshing(false);
    };

    void load();
    const intervalId = window.setInterval(() => {
      void load(true);
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [getAccessToken]);

  const runAction = async (action: "activate" | "pause" | "logout") => {
    const token = getAccessToken();
    if (!token) {
      setError("No hay una sesion autenticada para conectar WhatsApp.");
      return;
    }

    setActionBusy(action);
    if (action === "logout" || action === "pause") {
      skipNextAutoActivateRef.current = true;
      setIsGeneratingQr(false);
    }
    if (action === "activate") {
      skipNextAutoActivateRef.current = false;
      hasAutoActivatedRef.current = true;
      setIsGeneratingQr(true);
    }

    const actionResult =
      action === "activate"
        ? await activateWhatsappSession(token)
        : action === "pause"
          ? await pauseWhatsappSession(token)
          : await logoutWhatsappSession(token);
    setActionBusy(null);

    if (!actionResult.ok) {
      setError(actionResult.message);
      setIsGeneratingQr(false);
      return;
    }

    setSession(actionResult.session);
    setError(null);
    setIsGeneratingQr(!actionResult.session.qrCode && actionResult.session.status !== "connected");
  };

  const statusMeta = session?.status ? STATUS_COPY[session.status] : null;
  const showQr = Boolean(session?.qrCode && session.status === "pending");

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
      <Card className="bg-card/95">
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardDescription>Canal principal</CardDescription>
              <CardTitle>QR y estado de sesion</CardTitle>
            </div>
            {statusMeta ? <Badge className="max-w-full whitespace-normal text-center leading-4" variant={statusMeta.variant}>{statusMeta.label}</Badge> : <Badge className="max-w-full whitespace-normal text-center leading-4" variant="default">Sin inicializar</Badge>}
          </div>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="rounded-lg border border-dashed border-border bg-muted/20 px-5 py-6">
            {isLoading ? (
              <div className="grid min-h-[320px] place-items-center text-center">
                <div>
                  <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-panel-ink" />
                  <p className="mt-3 text-sm text-muted-foreground">Consultando el estado real de la sesion...</p>
                </div>
              </div>
            ) : isGeneratingQr ? (
              <div className="grid min-h-[320px] place-items-center text-center">
                <div>
                  <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-panel-ink" />
                  <p className="mt-4 text-sm font-medium text-panel-ink">Generando QR en el backend...</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Estamos iniciando el cliente de WhatsApp y esperando el primer QR.
                  </p>
                </div>
              </div>
            ) : showQr ? (
              <div className="grid gap-4 text-center">
                <img alt="QR de WhatsApp" className="mx-auto w-full max-w-[320px] rounded-lg border border-border bg-white p-3" src={session?.qrCode ?? undefined} />
                <p className="text-sm leading-6 text-muted-foreground">
                  Escanea este QR desde WhatsApp en el telefono principal del negocio. El panel detectara la conexion automaticamente.
                </p>
              </div>
            ) : (
              <div className="grid min-h-[320px] place-items-center text-center">
                <div>
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-md border border-border bg-card">
                    <QrCode className="h-6 w-6 text-panel-ink" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-panel-ink">
                    {session?.status === "connected"
                      ? "La sesion ya esta conectada y operativa."
                      : session?.status === "paused"
                        ? "La sesion esta en pausa y conserva las credenciales locales."
                        : session?.status === "disconnected" || session?.status === "expired"
                          ? "Activa la sesion para generar un QR nuevo o restaurar credenciales existentes."
                          : "Activa la sesion para que backend inicialice el cliente de WhatsApp."}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {isRefreshing ? "Actualizando estado..." : "El frontend solo refleja el estado que mantiene el backend."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <Card className="bg-card/95">
          <CardHeader>
            <CardDescription>Controles</CardDescription>
            <CardTitle>Acciones de sesion</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button disabled={actionBusy !== null} onClick={() => void runAction("activate")} type="button">
              {actionBusy === "activate" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Activar o reanudar
            </Button>
            <Button disabled={actionBusy !== null || !session?.id} onClick={() => void runAction("pause")} type="button" variant="secondary">
              {actionBusy === "pause" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4" />}
              Pausar sin perder credenciales
            </Button>
            <Button disabled={actionBusy !== null || !session?.id} onClick={() => void runAction("logout")} type="button" variant="outline">
              {actionBusy === "logout" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              Cerrar sesion y pedir QR nuevo
            </Button>
            <Button disabled={isRefreshing} onClick={() => window.location.reload()} type="button" variant="ghost">
              <RefreshCw className="h-4 w-4" />
              Recargar panel
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card/95">
          <CardHeader>
            <CardDescription>Dispositivo</CardDescription>
            <CardTitle>Salud del enlace</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-4">
              <div className="grid h-10 w-10 place-items-center rounded-md border border-border bg-muted/40">
                <Smartphone className="h-5 w-5 text-panel-ink" />
              </div>
              <div>
                <p className="text-sm font-medium text-panel-ink">Numero conectado</p>
                <p className="text-sm text-muted-foreground">{session?.phoneNumber ?? "Aun no disponible"}</p>
              </div>
            </div>
            <Detail label="Credenciales locales" value={session?.hasStoredCredentials ? "Disponibles" : "No disponibles"} />
            <Detail label="Cliente en memoria" value={session?.isRuntimeActive ? "Activo" : "Inactivo"} />
            <Detail label="Ultima actividad" value={formatDate(session?.lastSeenAt ?? null)} />
            <Detail label="Conexion establecida" value={formatDate(session?.connectedAt ?? null)} />
          </CardContent>
        </Card>
      </div>
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

