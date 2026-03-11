import { CalendarClock, Clock3 } from "lucide-react";
import { EmptyStateCard } from "@/components/dashboard/empty-state";

export function AppointmentsSection() {
  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <EmptyStateCard
        description="Agenda"
        icon={CalendarClock}
        message="Aun no hay citas reales registradas. Cuando el negocio comience a operar, la agenda aparecera aqui."
        title="Sin citas disponibles"
      />
      <EmptyStateCard
        description="Horarios"
        icon={Clock3}
        message="Los horarios y bloques de atencion apareceran aqui cuando se conecte la configuracion real del negocio."
        title="Sin horarios configurados"
      />
    </section>
  );
}
