import { ChevronRight, Lock, Workflow } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { navItems } from "@/data/dashboard";
import { cn } from "@/lib/utils";
import type { ViewId } from "@/types/dashboard";

export function Sidebar({
  activeView,
  onNavigate,
  setupIncomplete,
}: {
  activeView: ViewId;
  onNavigate: (id: ViewId) => void;
  setupIncomplete: boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg border border-panel-steel/50 bg-panel-ink text-panel-ivory">
            <Workflow className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-xl uppercase tracking-[0.16em] text-panel-ink">WhatsFlow</p>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Tu centro de atencion</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            const isLocked = setupIncomplete && item.id !== "settings";

            return (
              <button
                key={item.id}
                className={cn(
                  "flex w-full items-center justify-between rounded-md border px-3 py-3 text-left transition-colors",
                  isActive
                    ? "border-panel-steel bg-panel-ink text-panel-ivory"
                    : isLocked
                      ? "border-border/60 bg-muted/30 text-muted-foreground/80"
                      : "border-transparent text-muted-foreground hover:border-border hover:bg-card hover:text-foreground",
                )}
                onClick={() => onNavigate(item.id)}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </span>
                <span className="flex items-center gap-2">
                  {isLocked ? <Lock className="h-3.5 w-3.5 opacity-70" /> : null}
                  <ChevronRight className="h-4 w-4 opacity-60" />
                </span>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
