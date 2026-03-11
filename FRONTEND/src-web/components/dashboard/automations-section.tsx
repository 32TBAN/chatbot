import { Bot, Workflow } from "lucide-react";
import { EmptyStateCard } from "@/components/dashboard/empty-state";

export function AutomationsSection() {
  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <EmptyStateCard
        description="Flujos"
        icon={Bot}
        message="Aun no hay automatizaciones reales para mostrar. Cuando se conecten los datos del negocio, este modulo dejara de estar vacio."
        title="Sin automatizaciones disponibles"
      />
      <EmptyStateCard
        description="Mapa operativo"
        icon={Workflow}
        message="Aqui aparecera el detalle de cada flujo cuando existan automatizaciones creadas y sincronizadas."
        title="Sin detalle de flujo"
      />
    </section>
  );
}
