import { AlertTriangle, Bot, CheckCircle2, Clock3, MessageSquareText, Sparkles, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { automations } from "@/data/dashboard";
import { Connector, FlowStep, MiniInsight, activeFlowCard } from "@/components/dashboard/shared";
import { cn } from "@/lib/utils";

export function AutomationsSection() {
  return (
    <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="bg-card/95">
        <CardHeader>
          <CardDescription>Lista de flujos</CardDescription>
          <CardTitle>Automatizaciones activas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {automations.map((automation, index) => (
            <button key={automation.name} className={activeFlowCard(index === 0)}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{automation.name}</p>
                  <p className={cn("mt-1 text-sm", index === 0 ? "text-panel-ivory/70" : "text-muted-foreground")}>
                    {automation.volume}
                  </p>
                </div>
                <Badge variant={automation.status === "Activa" ? "success" : "warning"}>{automation.status}</Badge>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-card/95">
        <CardHeader>
          <CardDescription>Vista maestro-detalle</CardDescription>
          <CardTitle>Mapa operativo del flujo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-4">
            <FlowStep icon={MessageSquareText} label="Disparador" content={automations[0].trigger} />
            <Connector />
            <FlowStep icon={Sparkles} label="Condicion" content={automations[0].condition} />
            <Connector />
            <FlowStep icon={Bot} label="Accion" content={automations[0].action} />
            <Connector />
            <FlowStep icon={CheckCircle2} label="Resultado" content={automations[0].result} />
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-3">
            <MiniInsight icon={Clock3} label="Tiempo medio" value="26s" detail="Desde disparador a confirmacion" />
            <MiniInsight icon={AlertTriangle} label="Excepciones" value="3" detail="Mensajes fuera de horario" />
            <MiniInsight icon={Workflow} label="Uso del flujo" value="24" detail="Ejecuciones hoy" />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
