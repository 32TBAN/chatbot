import { History, Inbox } from "lucide-react";
import { EmptyStateCard } from "@/components/dashboard/empty-state";

export function HistorySection() {
  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <EmptyStateCard
        description="Trazabilidad"
        icon={History}
        message="Aun no hay interacciones reales para revisar. Este historial se llenara cuando el negocio empiece a recibir actividad."
        title="Sin historial disponible"
      />
      <EmptyStateCard
        description="Lecturas"
        icon={Inbox}
        message="Los indicadores de actividad apareceran aqui cuando existan eventos reales en el sistema."
        title="Sin actividad registrada"
      />
    </section>
  );
}
