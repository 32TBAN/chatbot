import { KeyRound, LoaderCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/auth/field";
import type { LoginValues } from "@/types/auth";

export function LoginForm({
  authBusy,
  errors,
  onChange,
  onRecover,
  onSubmit,
  values,
}: {
  authBusy: boolean;
  errors: Partial<Record<keyof LoginValues, string>>;
  onChange: React.Dispatch<React.SetStateAction<LoginValues>>;
  onRecover: () => void;
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
          placeholder="Minimo 8 caracteres"
          type="password"
          value={values.password}
        />
      </Field>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button className="text-sm text-panel-ink underline-offset-4 hover:underline" onClick={onRecover} type="button">
          ¿Olvidaste tu contrasena?
        </button>
        <Button disabled={authBusy} type="submit">
          {authBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          Entrar
        </Button>
      </div>
    </form>
  );
}
