import { Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { qrStats } from "@/data/dashboard";

export function QrSection() {
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_360px]">
      <Card className="bg-card/95">
        <CardHeader>
          <CardDescription>Enlace actual</CardDescription>
          <CardTitle>Conexion QR y resiliencia</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="rounded-lg border border-border bg-panel-ink p-6 text-panel-ivory">
            <div className="rounded-lg border border-panel-steel/35 bg-panel-ivory p-5 text-panel-ink">
              <div className="grid aspect-square place-items-center rounded-md border border-dashed border-panel-steel/40">
                <Workflow className="h-24 w-24" />
              </div>
            </div>
            <p className="mt-4 text-sm text-panel-ivory/70">
              QR listo para reconexion segura en caso de cambio de sesion.
            </p>
          </div>

          <div className="grid gap-4">
            {qrStats.map((item) => (
              <div key={item.label} className="rounded-lg border border-border px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-sm font-medium text-panel-ink">{item.value}</p>
              </div>
            ))}
            <div className="flex flex-wrap gap-3">
              <Button>Reconectar sesion</Button>
              <Button variant="outline">Reemplazar dispositivo</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/95">
        <CardHeader>
          <CardDescription>Prevencion</CardDescription>
          <CardTitle>Eventos criticos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-4">
            <p className="font-medium text-warning">Riesgo bajo de expiracion</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Recomendado volver a validar el dispositivo esta semana.
            </p>
          </div>
          <div className="rounded-lg border border-border px-4 py-4">
            <p className="font-medium text-panel-ink">Fallback operativo</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Si la sesion cae, el operador puede responder manualmente desde el numero conectado.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
