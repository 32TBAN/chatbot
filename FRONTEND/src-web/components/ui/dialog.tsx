import { type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Dialog({
  children,
  onOpenChange,
  open,
}: {
  children: ReactNode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onOpenChange, open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {children}
    </div>,
    document.body,
  );
}

export function DialogOverlay({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  return <button aria-label="Cerrar modal" className={cn("absolute inset-0 bg-panel-ink/45 backdrop-blur-sm", className)} onClick={onClick} type="button" />;
}

export function DialogContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative z-10 flex max-h-[calc(100vh-1.5rem)] w-full max-w-[min(960px,100%)] flex-col overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-[0_30px_120px_rgba(20,28,38,0.18)] sm:max-h-[calc(100vh-3rem)]",
        className,
      )}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  );
}

export function DialogHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6 sm:py-5", className)}>{children}</div>;
}

export function DialogTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn("font-display text-xl uppercase tracking-[0.1em] text-panel-ink sm:text-2xl", className)}>{children}</h3>;
}

export function DialogDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("mt-2 text-sm leading-6 text-muted-foreground", className)}>{children}</p>;
}

export function DialogBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid min-h-0 flex-1 gap-5 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5", className)}>{children}</div>;
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex shrink-0 flex-col-reverse gap-3 border-t border-border px-5 py-4 sm:flex-row sm:justify-end sm:px-6 sm:py-5", className)}>{children}</div>;
}

export function DialogCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      aria-label="Cerrar modal"
      className="grid h-10 w-10 place-items-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      onClick={onClick}
      type="button"
    >
      <X className="h-4 w-4" />
    </button>
  );
}
