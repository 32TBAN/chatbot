import { PackageSearch, Tags } from "lucide-react";
import { EmptyStateCard } from "@/components/dashboard/empty-state";

export function CatalogSection() {
  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <EmptyStateCard
        description="Catalogo"
        icon={PackageSearch}
        message="Aun no hay productos reales cargados. Este modulo mostrara el catalogo cuando la fuente de datos este conectada."
        title="Sin productos disponibles"
      />
      <EmptyStateCard
        description="Visibilidad"
        icon={Tags}
        message="Los estados de visibilidad y categorias apareceran aqui cuando existan productos reales."
        title="Sin datos de catalogo"
      />
    </section>
  );
}
