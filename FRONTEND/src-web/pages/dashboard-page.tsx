import { useState } from "react";
import { headerStats, pageTitles } from "@/data/dashboard";
import { AutomationsSection } from "@/components/dashboard/automations-section";
import { AppointmentsSection } from "@/components/dashboard/appointments-section";
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

export function DashboardPage() {
  const { logoutBusy, performLogout, sessionUser } = useAuth();
  const [activeView, setActiveView] = useState<ViewId>("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const page = pageTitles[activeView];

  if (!sessionUser) return null;

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
            onNavigate={(id) => {
              setActiveView(id);
              setMenuOpen(false);
            }}
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
          />
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
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {headerStats.map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-border bg-card px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="mt-2 font-mono text-sm text-panel-ink">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-grid bg-[size:32px_32px] px-4 py-6 sm:px-6 lg:px-8">
            <div className="grid gap-6">
              {activeView === "overview" ? <OverviewSection /> : null}
              {activeView === "automations" ? <AutomationsSection /> : null}
              {activeView === "qr" ? <QrSection /> : null}
              {activeView === "appointments" ? <AppointmentsSection /> : null}
              {activeView === "catalog" ? <CatalogSection /> : null}
              {activeView === "history" ? <HistorySection /> : null}
              {activeView === "settings" ? <SettingsSection /> : null}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
