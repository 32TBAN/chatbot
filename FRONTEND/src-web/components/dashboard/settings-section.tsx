import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { settingsGroups } from "@/data/dashboard";

export function SettingsSection() {
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_340px]">
      <Card className="bg-card/95">
        <CardHeader>
          <CardDescription>Ajustes esenciales</CardDescription>
          <CardTitle>Configuracion general del negocio</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {settingsGroups.map((group) => (
            <div key={group.title} className="rounded-lg border border-border px-4 py-4">
              <p className="font-medium text-panel-ink">{group.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{group.detail}</p>
              <Button variant="ghost" className="mt-4 px-0 text-panel-ink hover:bg-transparent">
                Editar modulo
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-card/95">
        <CardHeader>
          <CardDescription>Politica de acceso</CardDescription>
          <CardTitle>Roles del MVP</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border px-4 py-4">
            <p className="font-medium text-panel-ink">Owner</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Control total sobre conexion, automatizaciones, horarios y catalogo.
            </p>
          </div>
          <div className="rounded-lg border border-border px-4 py-4">
            <p className="font-medium text-panel-ink">Operador</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Acceso a citas, historial y revision de respuestas sugeridas.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
