import type { AuthStatusTone } from "@/types/auth";
import { cn } from "@/lib/utils";

export function StatusAlert({
  className,
  message,
  tone,
}: {
  className?: string;
  message: string;
  tone: AuthStatusTone;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        tone === "error" && "border-destructive/30 bg-destructive/10 text-destructive",
        tone === "success" && "border-success/30 bg-success/10 text-success",
        tone === "warning" && "border-warning/30 bg-warning/10 text-warning",
        tone === "neutral" && "border-border bg-muted/55 text-foreground",
        className,
      )}
    >
      {message}
    </div>
  );
}
