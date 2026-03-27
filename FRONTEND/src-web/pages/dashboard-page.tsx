import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { pageTitles } from "@/data/dashboard";
import { AppointmentsSection } from "@/components/dashboard/appointments-section";
import { AutomationsSection } from "@/components/dashboard/automations-section";
import { CatalogSection } from "@/components/dashboard/catalog-section";
import { HistorySection } from "@/components/dashboard/history-section";
import { OverviewSection } from "@/components/dashboard/overview-section";
import { QrSection } from "@/components/dashboard/qr-section";
import { SettingsSection } from "@/components/dashboard/settings-section";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { useAuth } from "@/contexts/auth-context";
import type { ViewId } from "@/types/dashboard";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const BLOCKED_MESSAGE = "Completa los datos de tu negocio para abrir el resto de herramientas.";

export function DashboardPage() {
  const { logoutBusy, performLogout, sessionUser } = useAuth();
  const [activeView, setActiveView] = useState<ViewId>("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [blockedNotice, setBlockedNotice] = useState<string | null>(null);
  const [focusFormSignal, setFocusFormSignal] = useState(0);
  const setupIncomplete = !sessionUser?.businessId || !sessionUser?.business?.name?.trim();

  useEffect(() => {
    if (setupIncomplete && activeView !== "settings") {
      setActiveView("settings");
    }
  }, [activeView, setupIncomplete]);

  if (!sessionUser) return null;

  const handleNavigate = (id: ViewId) => {
    if (setupIncomplete && id !== "settings") {
      setActiveView("settings");
      setBlockedNotice(BLOCKED_MESSAGE);
      setMenuOpen(false);
      return;
    }

    setBlockedNotice(null);
    setActiveView(id);
    setMenuOpen(false);
  };

  const handleGoToSettingsForm = () => {
    setBlockedNotice(null);
    setActiveView("settings");
    setMenuOpen(false);
    setFocusFormSignal((current) => current + 1);
  };

  const handleBusinessCreated = () => {
    setBlockedNotice(null);
    setActiveView("overview");
  };

  const page = pageTitles[activeView];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid min-h-screen max-w-[1680px] grid-cols-1 lg:grid-cols-[272px_minmax(0,1fr)]">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-[272px] border-r border-border bg-background/95 backdrop-blur-md transition-transform lg:static lg:translate-x-0",
            menuOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <Sidebar
            activeView={activeView}
            onNavigate={handleNavigate}
            setupIncomplete={setupIncomplete}
          />
        </aside>

        {menuOpen ? (
          <button
            aria-label="Cerrar menu"
            className="fixed inset-0 z-30 bg-panel-ink/30 lg:hidden"
            onClick={() => setMenuOpen(false)}
          />
        ) : null}

        <main className="relative min-w-0">
          <TopBar
            activeView={activeView}
            logoutBusy={logoutBusy}
            onLogout={performLogout}
            onOpenMenu={() => setMenuOpen(true)}
            sessionUser={sessionUser}
            setupIncomplete={setupIncomplete}
          />
          {setupIncomplete ? (
            <div className="border-b border-amber-300/70 bg-amber-100/70 px-4 py-4 text-panel-ink sm:px-6 lg:px-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-md border border-amber-400/70 bg-amber-200/60">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-panel-ink/70">Falta un paso</p>
                    <p className="mt-1 text-sm font-medium">Completa la informacion de tu negocio para empezar a usar WhatsFlow.</p>
                    <p className="mt-1 text-sm text-panel-ink/75">
                      Por ahora solo esta disponible la seccion `Tu negocio` para terminar la configuracion inicial.
                    </p>
                    {blockedNotice ? <p className="mt-2 text-sm text-panel-ink/75">{blockedNotice}</p> : null}
                  </div>
                </div>
                <Button onClick={handleGoToSettingsForm} variant="secondary">
                  Completar negocio
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
          <div className="border-b border-border bg-background/70 px-4 py-6 backdrop-blur-sm sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <p className="font-display text-xs uppercase tracking-[0.36em] text-muted-foreground">
                  {page.eyebrow}
                </p>
                <h1 className="mt-2 font-display text-3xl uppercase tracking-[0.1em] text-panel-ink sm:text-4xl">
                  {page.title}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  {page.description}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-grid bg-[size:32px_32px] px-4 py-6 sm:px-6 lg:px-8">
            <div className="grid gap-6">
              {activeView === "overview" ? <OverviewSection sessionUser={sessionUser} /> : null}
              {activeView === "automations" ? <AutomationsSection /> : null}
              {activeView === "qr" ? <QrSection /> : null}
              {activeView === "appointments" ? <AppointmentsSection /> : null}
              {activeView === "catalog" ? <CatalogSection /> : null}
              {activeView === "history" ? <HistorySection /> : null}
              {activeView === "settings" ? (
                <SettingsSection
                  focusFormSignal={focusFormSignal}
                  onBusinessCreated={handleBusinessCreated}
                  sessionUser={sessionUser}
                  setupIncomplete={setupIncomplete}
                />
              ) : null}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
