import { LoaderCircle, Mail } from "lucide-react";
import { Field } from "@/components/auth/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateEmail } from "@/lib/validation/auth";
import type { LoginValues } from "@/types/auth";

export function RecoverForm({
  authBusy,
  onBack,
  onChange,
  onSubmit,
  values,
}: {
  authBusy: boolean;
  onBack: () => void;
  onChange: React.Dispatch<React.SetStateAction<LoginValues>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  values: LoginValues;
}) {
  return (
    <form className="mt-6 space-y-5" onSubmit={onSubmit}>
      <Field error={validateEmail(values.email)} icon={Mail} label="Email" value={values.email}>
        <Input
          autoComplete="email"
          disabled={authBusy}
          onChange={(event) => onChange((current) => ({ ...current, email: event.target.value }))}
          placeholder="tu@negocio.com"
          value={values.email}
        />
      </Field>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button className="text-sm text-panel-ink underline-offset-4 hover:underline" onClick={onBack} type="button">
          Volver a iniciar sesion
        </button>
        <Button disabled={authBusy} type="submit">
          {authBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          Enviar recuperacion
        </Button>
      </div>
    </form>
  );
}
