import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function EmptyStateCard({
  description,
  icon: Icon,
  message,
  title,
}: {
  description: string;
  icon: LucideIcon;
  message: string;
  title: string;
}) {
  return (
    <Card className="bg-card/95">
      <CardHeader>
        <CardDescription>{description}</CardDescription>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-dashed border-border bg-muted/20 px-5 py-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-md border border-border bg-card">
            <Icon className="h-5 w-5 text-panel-ink" />
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
}
