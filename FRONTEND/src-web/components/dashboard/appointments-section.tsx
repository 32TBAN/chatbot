import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { appointments } from "@/data/dashboard";

export function AppointmentsSection() {
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_320px]">
      <Card className="bg-card/95">
        <CardHeader>
          <CardDescription>Bloques del dia</CardDescription>
          <CardTitle>Agenda y confirmaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {appointments.map((item) => (
            <div
              key={`${item.time}-${item.client}`}
              className="grid gap-3 rounded-lg border border-border px-4 py-4 md:grid-cols-[90px_minmax(0,1fr)_auto]"
            >
              <div className="font-mono text-sm text-panel-ink">{item.time}</div>
              <div>
                <p className="font-medium text-panel-ink">{item.client}</p>
                <p className="text-sm text-muted-foreground">{item.reason}</p>
              </div>
              <Badge variant={item.state === "Confirmada" ? "success" : "warning"}>{item.state}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-card/95">
        <CardHeader>
          <CardDescription>Horario laboral</CardDescription>
          <CardTitle>Disponibilidad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            ["Lun - Vie", "08:00 - 18:00"],
            ["Sabado", "09:00 - 12:00"],
            ["Domingo", "Sin atencion"],
          ].map(([day, value]) => (
            <div key={day} className="rounded-lg border border-border px-4 py-3">
              <p className="text-sm font-medium text-panel-ink">{day}</p>
              <p className="mt-1 text-sm text-muted-foreground">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
