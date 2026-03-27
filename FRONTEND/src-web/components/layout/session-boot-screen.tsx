import { LoaderCircle } from "lucide-react";

export function SessionBootScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg border border-panel-steel/50 bg-panel-ink text-panel-ivory">
          <LoaderCircle className="h-5 w-5 animate-spin" />
        </div>
        <p className="mt-5 font-display text-2xl uppercase tracking-[0.14em] text-panel-ink">
          Entrando a WhatsFlow
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Estamos preparando tu cuenta y cargando la informacion de tu negocio.
        </p>
      </div>
    </div>
  );
}
