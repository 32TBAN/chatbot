import { ChevronRight, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { navItems, overviewRosterIcon, teamSnapshot } from "@/data/dashboard";
import { cn } from "@/lib/utils";
import type { ViewId } from "@/types/dashboard";

export function Sidebar({
  activeView,
  onNavigate,
}: {
  activeView: ViewId;
  onNavigate: (id: ViewId) => void;
}) {
  const TeamIcon = overviewRosterIcon;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg border border-panel-steel/50 bg-panel-ink text-panel-ivory">
            <Workflow className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-xl uppercase tracking-[0.16em] text-panel-ink">WhatsFlow</p>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Panel operativo</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-6">
          <div className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md border px-3 py-3 text-left transition-colors",
                    isActive
                      ? "border-panel-steel bg-panel-ink text-panel-ivory"
                      : "border-transparent text-muted-foreground hover:border-border hover:bg-card hover:text-foreground",
                  )}
                  onClick={() => onNavigate(item.id)}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 opacity-60" />
                </button>
              );
            })}
          </div>

          <Card className="border-panel-steel/40 bg-panel-ink text-panel-ivory">
            <CardHeader className="border-panel-steel/30">
              <CardDescription className="text-panel-ivory/70">Cobertura operativa</CardDescription>
              <CardTitle className="text-lg">Equipo y acceso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-md border border-panel-steel/30 px-3 py-3">
                <div className="flex items-center gap-3">
                  <TeamIcon className="h-4 w-4 text-panel-signal" />
                  <div>
                    <p className="text-sm font-medium">3 usuarios habilitados</p>
                    <p className="text-xs text-panel-ivory/65">Cobertura completa hoy</p>
                  </div>
                </div>
                <Badge variant="success">Online</Badge>
              </div>
              <div className="space-y-3 text-sm">
                {teamSnapshot.map((member) => (
                  <div key={member.name} className="rounded-md border border-panel-steel/30 px-3 py-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs uppercase tracking-[0.16em] text-panel-ivory/65">{member.role}</p>
                    </div>
                    <p className="mt-1 text-xs text-panel-ivory/70">{member.coverage}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
