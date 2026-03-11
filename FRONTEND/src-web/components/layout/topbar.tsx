import { LoaderCircle, LogOut, Menu, PanelTop, SearchCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { navItems } from "@/data/dashboard";
import type { AuthUser } from "@/types/auth";
import type { ViewId } from "@/types/dashboard";

export function TopBar({
  activeView,
  logoutBusy,
  onLogout,
  onOpenMenu,
  sessionUser,
  setupIncomplete,
}: {
  activeView: ViewId;
  logoutBusy: boolean;
  onLogout: () => void;
  onOpenMenu: () => void;
  sessionUser: AuthUser;
  setupIncomplete: boolean;
}) {
  const activeLabel = navItems.find((item) => item.id === activeView)?.shortLabel;
  const label = sessionUser.name?.trim() || sessionUser.email;

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMenu}>
          <Menu className="h-4 w-4" />
        </Button>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <PanelTop className="h-4 w-4 text-panel-ink" />
          <p className="truncate text-sm uppercase tracking-[0.18em] text-muted-foreground">
            {activeLabel}
          </p>
        </div>
        <div className="hidden min-w-[280px] items-center gap-2 rounded-md border border-border bg-card px-3 py-2 md:flex">
          <SearchCheck className="h-4 w-4 text-muted-foreground" />
          <Input
            className="h-auto border-0 bg-transparent px-0 py-0 focus-visible:ring-0"
            placeholder="Buscar cliente, flujo o ajuste..."
          />
        </div>
        <Badge variant={setupIncomplete ? "warning" : "success"} className="hidden sm:inline-flex">
          {setupIncomplete ? "Configuracion requerida" : "Whatsapp estable"}
        </Badge>
        <div className="hidden rounded-md border border-border bg-card px-3 py-2 lg:block">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Sesion</p>
          <p className="max-w-[180px] truncate text-sm text-panel-ink">{label}</p>
        </div>
        <Button disabled={logoutBusy} onClick={onLogout} size="sm" variant="outline">
          {logoutBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          Salir
        </Button>
      </div>
    </header>
  );
}
