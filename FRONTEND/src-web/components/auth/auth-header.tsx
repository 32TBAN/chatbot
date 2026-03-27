export function AuthHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <>
      <p className="font-display text-xs uppercase tracking-[0.28em] text-muted-foreground">
        Acceso a tu negocio
      </p>
      <h2 className="mt-2 font-display text-3xl uppercase tracking-[0.08em] text-panel-ink">
        {title}
      </h2>
      <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">{description}</p>
    </>
  );
}
