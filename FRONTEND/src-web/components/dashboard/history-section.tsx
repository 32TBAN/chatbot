import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { interactions } from "@/data/dashboard";
import { InlineMeta } from "@/components/dashboard/shared";

export function HistorySection() {
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_320px]">
      <Card className="bg-card/95">
        <CardHeader>
          <CardDescription>Ultima actividad</CardDescription>
          <CardTitle>Trazabilidad de interacciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {interactions.map((item) => (
            <div key={`${item.customer}-${item.time}`} className="rounded-lg border border-border px-4 py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-medium text-panel-ink">{item.customer}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.reason}</p>
                </div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.time}</p>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <InlineMeta label="Flujo" value={item.automation} />
                <InlineMeta label="Resultado" value={item.outcome} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-card/95">
        <CardHeader>
          <CardDescription>Filtro rapido</CardDescription>
          <CardTitle>Lecturas de hoy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InlineMeta label="Interacciones con operador" value="12" />
          <InlineMeta label="Resueltas solo por bot" value="29" />
          <InlineMeta label="Escaladas a soporte" value="4" />
        </CardContent>
      </Card>
    </section>
  );
}
