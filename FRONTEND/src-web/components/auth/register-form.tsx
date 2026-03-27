import { KeyRound, LoaderCircle, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/auth/field";
import type { RegisterValues } from "@/types/auth";

export function RegisterForm({
  authBusy,
  errors,
  onChange,
  onRecoverExisting,
  onSubmit,
  values,
}: {
  authBusy: boolean;
  errors: Partial<Record<keyof RegisterValues, string>>;
  onChange: React.Dispatch<React.SetStateAction<RegisterValues>>;
  onRecoverExisting: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  values: RegisterValues;
}) {
  return (
    <form className="mt-6 grid gap-5 sm:grid-cols-2" onSubmit={onSubmit}>
      <Field error={errors.name} icon={UserRound} label="Tu nombre" value={values.name}>
        <Input
          disabled={authBusy}
          onChange={(event) => onChange((current) => ({ ...current, name: event.target.value }))}
          placeholder="Como quieres que te llamemos"
          value={values.name}
        />
      </Field>
      <Field error={errors.phone} icon={Phone} label="Telefono" value={values.phone}>
        <Input
          disabled={authBusy}
          onChange={(event) => onChange((current) => ({ ...current, phone: event.target.value }))}
          placeholder="Opcional"
          value={values.phone}
        />
      </Field>
      <Field className="sm:col-span-2" error={errors.email} icon={Mail} label="Correo" value={values.email}>
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
          autoComplete="new-password"
          disabled={authBusy}
          onChange={(event) => onChange((current) => ({ ...current, password: event.target.value }))}
          placeholder="Minimo 6 caracteres"
          type="password"
          value={values.password}
        />
      </Field>
      <Field
        error={errors.confirmPassword}
        icon={ShieldCheck}
        label="Repite tu contrasena"
        value={values.confirmPassword}
      >
        <Input
          autoComplete="new-password"
          disabled={authBusy}
          onChange={(event) => onChange((current) => ({ ...current, confirmPassword: event.target.value }))}
          placeholder="Vuelve a escribirla"
          type="password"
          value={values.confirmPassword}
        />
      </Field>
      <div className="sm:col-span-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button className="text-left text-sm text-panel-ink underline-offset-4 hover:underline" onClick={onRecoverExisting} type="button">
            Ya tienes cuenta? Entra aqui
          </button>
          <Button disabled={authBusy} type="submit">
            {authBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            Crear cuenta
          </Button>
        </div>
      </div>
    </form>
  );
}
