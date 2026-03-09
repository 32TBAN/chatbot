import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Field({
  children,
  className,
  error,
  icon: Icon,
  label,
  value,
}: {
  children: ReactNode;
  className?: string;
  error?: string;
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <label className={cn("grid gap-2", className)}>
      <span className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      {children}
      <span className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}>
        {error ?? helperText(label, value)}
      </span>
    </label>
  );
}

function helperText(label: string, value: string) {
  if (!value.trim()) {
    if (label === "Name" || label === "Phone") return "Campo opcional.";
    return "Campo obligatorio.";
  }

  return "Listo para enviar.";
}
