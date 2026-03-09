import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { catalogItems } from "@/data/dashboard";

export function CatalogSection() {
  return (
    <section className="grid gap-6">
      <Card className="bg-card/95">
        <CardHeader>
          <CardDescription>Catalogo utilitario</CardDescription>
          <CardTitle>Productos visibles en WhatsApp</CardTitle>
        </CardHeader>
        <CardContent className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-muted/55">
                <tr className="text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  <th className="border-b border-border px-5 py-4 font-medium">Producto</th>
                  <th className="border-b border-border px-5 py-4 font-medium">Categoria</th>
                  <th className="border-b border-border px-5 py-4 font-medium">Precio</th>
                  <th className="border-b border-border px-5 py-4 font-medium">Stock</th>
                  <th className="border-b border-border px-5 py-4 font-medium">Visibilidad</th>
                </tr>
              </thead>
              <tbody>
                {catalogItems.map((item) => (
                  <tr key={item.name} className="hover:bg-muted/35">
                    <td className="border-b border-border px-5 py-4 font-medium text-panel-ink">{item.name}</td>
                    <td className="border-b border-border px-5 py-4 text-muted-foreground">{item.category}</td>
                    <td className="border-b border-border px-5 py-4 font-mono text-panel-ink">{item.price}</td>
                    <td className="border-b border-border px-5 py-4 text-muted-foreground">{item.stock}</td>
                    <td className="border-b border-border px-5 py-4">
                      <Badge variant={item.visibility === "Visible" ? "success" : "warning"}>{item.visibility}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
