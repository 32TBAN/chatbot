import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function FlowStep({
  icon: Icon,
  label,
  content,
}: {
  icon: LucideIcon;
  label: string;
  content: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/90 px-4 py-4">
      <div className="flex items-start gap-4">
        <div className="grid h-10 w-10 place-items-center rounded-md border border-border bg-muted">
          <Icon className="h-4 w-4 text-panel-ink" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <p className="mt-2 text-sm leading-6 text-panel-ink">{content}</p>
        </div>
      </div>
    </div>
  );
}

export function Connector() {
  return (
    <div className="flex items-center gap-3 px-3 text-muted-foreground">
      <div className="h-px flex-1 bg-border" />
      <ArrowRight className="h-4 w-4" />
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

export function MiniInsight({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-border px-4 py-4">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-panel-ink" />
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      </div>
      <p className="mt-3 font-display text-3xl uppercase tracking-[0.08em] text-panel-ink">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

export function InlineMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm text-panel-ink">{value}</p>
    </div>
  );
}

export const toneBadge = {
  success: "success",
  warning: "warning",
  default: "default",
} as const;

export function activeFlowCard(isActive: boolean) {
  return cn(
    "w-full rounded-lg border px-4 py-4 text-left transition-colors",
    isActive
      ? "border-panel-steel bg-panel-ink text-panel-ivory"
      : "border-border bg-background hover:bg-muted/45",
  );
}
