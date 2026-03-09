import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  automationHealth,
  metrics,
  onboardingSteps,
  overviewActions,
  overviewHighlights,
  statusCards,
} from "@/data/dashboard";
import { toneBadge } from "@/components/dashboard/shared";

export function OverviewSection() {
  return (
    <>
      <section className="grid gap-4 lg:grid-cols-4">
        {statusCards.map((card) => (
          <Card key={card.label} className="bg-card/95">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{card.label}</p>
                  <p className="mt-2 font-display text-3xl uppercase tracking-[0.08em] text-panel-ink">
                    {card.value}
                  </p>
                </div>
                <Badge variant={toneBadge[card.tone]}>{card.tone}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{card.detail}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
        <Card className="bg-card/95">
          <CardHeader>
            <CardDescription>Checklist de arranque</CardDescription>
            <CardTitle>Onboarding del negocio</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {onboardingSteps.map((step, index) => (
              <div
                key={step.title}
                className="grid gap-3 rounded-lg border border-border px-4 py-4 sm:grid-cols-[auto_1fr_auto]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted text-xs font-semibold">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-panel-ink">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.detail}</p>
                </div>
                <Badge variant={step.done ? "success" : "warning"}>{step.done ? "Completo" : "Pendiente"}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card className="bg-card/95">
            <CardHeader>
              <CardDescription>Lectura rapida</CardDescription>
              <CardTitle>Estado de operacion</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {overviewHighlights.map((item) => (
                <div key={item.title} className="rounded-lg border border-border px-4 py-4">
                  <p className="font-medium text-panel-ink">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card/95">
            <CardHeader>
              <CardDescription>Acciones sugeridas</CardDescription>
              <CardTitle>Siguiente intervencion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {overviewActions.map((action) => (
                <button
                  key={action}
                  className="flex w-full items-center justify-between rounded-md border border-border px-4 py-3 text-left text-sm hover:bg-muted/60"
                >
                  <span>{action}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Card className="bg-card/95">
          <CardHeader>
            <CardDescription>Senales basicas</CardDescription>
            <CardTitle>Metricas operativas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-lg border border-border px-4 py-5">
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <p className="mt-3 font-display text-3xl uppercase tracking-[0.08em] text-panel-ink">{metric.value}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-success">{metric.change}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card/95">
          <CardHeader>
            <CardDescription>Salud de automatizacion</CardDescription>
            <CardTitle>Cobertura por proceso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {automationHealth.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{item.label}</span>
                  <span className="font-mono text-panel-ink">{item.value}%</span>
                </div>
                <Progress value={item.value} />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
