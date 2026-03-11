import { Activity, Building2, Inbox } from "lucide-react";
import { EmptyStateCard } from "@/components/dashboard/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuthUser } from "@/types/auth";

export function OverviewSection({ sessionUser }: { sessionUser: AuthUser }) {
  const businessName = sessionUser.business?.name?.trim();

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_340px]">
      <Card className="bg-card/95">
        <CardHeader>
          <CardDescription>Estado actual</CardDescription>
          <CardTitle>Resumen del negocio</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="rounded-lg border border-border px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Cuenta activa</p>
            <p className="mt-2 text-sm font-medium text-panel-ink">{sessionUser.email}</p>
          </div>
          <div className="rounded-lg border border-border px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Negocio</p>
            <p className="mt-2 text-sm font-medium text-panel-ink">{businessName || "Sin configurar"}</p>
          </div>
          <div className="rounded-lg border border-border px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Estado del panel</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {businessName
                ? "El panel esta listo para comenzar a recibir datos reales."
                : "Completa la configuracion del negocio para habilitar el panel."}
            </p>
          </div>
        </CardContent>
      </Card>

      <EmptyStateCard
        description="Primeros datos"
        icon={Inbox}
        message="Aun no hay datos reales para mostrar en el resumen. Este espacio se llenara cuando el negocio comience a operar en el MVP."
        title="Sin actividad disponible"
      />

      <EmptyStateCard
        description="Automatizaciones"
        icon={Activity}
        message="Las automatizaciones apareceran aqui cuando exista informacion real conectada."
        title="Sin datos de flujos"
      />

      <EmptyStateCard
        description="Negocio"
        icon={Building2}
        message="Los indicadores del negocio se mostraran aqui cuando la operacion empiece a generar datos reales."
        title="Sin indicadores disponibles"
      />
    </section>
  );
}
