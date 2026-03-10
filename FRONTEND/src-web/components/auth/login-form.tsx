import { KeyRound, LoaderCircle, Mail } from "lucide-react";
import { Field } from "@/components/auth/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LoginValues } from "@/types/auth";

export function LoginForm({
  authBusy,
  errors,
  onChange,
  onSubmit,
  values,
}: {
  authBusy: boolean;
  errors: Partial<Record<keyof LoginValues, string>>;
  onChange: React.Dispatch<React.SetStateAction<LoginValues>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  values: LoginValues;
}) {
  return (
    <form className="mt-6 space-y-5" onSubmit={onSubmit}>
      <Field error={errors.email} icon={Mail} label="Email" value={values.email}>
        <Input
          autoComplete="email"
          disabled={authBusy}
          onChange={(event) => onChange((current) => ({ ...current, email: event.target.value }))}
          placeholder="tu@negocio.com"
          value={values.email}
        />
      </Field>
      <Field error={errors.password} icon={KeyRound} label="Contrasena" value={values.password}>
        <Input
          autoComplete="current-password"
          disabled={authBusy}
          onChange={(event) => onChange((current) => ({ ...current, password: event.target.value }))}
          placeholder="Minimo 6 caracteres"
          type="password"
          value={values.password}
        />
      </Field>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Usa las credenciales activas configuradas en el backend.</p>
        <Button disabled={authBusy} type="submit">
          {authBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          Entrar
        </Button>
      </div>
    </form>
  );
}
