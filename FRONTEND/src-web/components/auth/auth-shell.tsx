import { Phone, ShieldCheck, Workflow } from "lucide-react";
import { AuthHeader } from "@/components/auth/auth-header";
import { LoginForm } from "@/components/auth/login-form";
import { RecoverForm } from "@/components/auth/recover-form";
import { RegisterForm } from "@/components/auth/register-form";
import { StatusAlert } from "@/components/auth/status-alert";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

export function AuthShell() {
  const {
    authBusy,
    authMode,
    authStatus,
    loginErrors,
    loginValues,
    registerErrors,
    registerValues,
    setLoginValues,
    setRegisterValues,
    submitLogin,
    submitRecover,
    submitRegister,
    switchMode,
  } = useAuth();

  return (
    <div className="min-h-screen bg-background px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1480px] overflow-hidden rounded-[1.5rem] border border-border bg-card lg:grid-cols-[0.45fr_0.55fr]">
        <section className="relative border-b border-border bg-panel-ink px-6 py-8 text-panel-ivory lg:border-b-0 lg:border-r lg:px-10 lg:py-10">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg border border-panel-steel/40 bg-panel-ivory/5">
              <Workflow className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-xl uppercase tracking-[0.16em]">WhatsFlow</p>
              <p className="text-xs uppercase tracking-[0.22em] text-panel-ivory/60">
                Operacion por WhatsApp
              </p>
            </div>
          </div>

          <div className="mt-10 max-w-xl">
            <p className="font-display text-xs uppercase tracking-[0.34em] text-panel-ivory/60">
              Acceso al panel
            </p>
            <h1 className="mt-3 font-display text-4xl uppercase tracking-[0.08em] sm:text-5xl">
              Controla flujos, citas y conexion desde una sola mesa.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-panel-ivory/72 sm:text-base">
              Entra con tu cuenta o crea una nueva para preparar automatizaciones, operar reservas y
              mantener la atencion del negocio bajo una sesion segura.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {[
              {
                icon: Workflow,
                title: "Automatizaciones activas",
                detail: "Flujos editables con resultados visibles y trazables.",
              },
              {
                icon: ShieldCheck,
                title: "Sesion persistente",
                detail: "Acceso continuo y preparado para integracion real de backend.",
              },
              {
                icon: Phone,
                title: "Operacion conectada",
                detail: "QR, citas y catalogo bajo una sola capa de acceso.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-xl border border-panel-steel/35 bg-panel-ivory/5 p-4">
                  <div className="grid h-10 w-10 place-items-center rounded-md border border-panel-steel/35 bg-panel-ivory/5">
                    <Icon className="h-4 w-4 text-panel-signal" />
                  </div>
                  <p className="mt-4 text-sm font-medium">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-panel-ivory/65">{item.detail}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-card px-4 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <div className="mx-auto flex max-w-xl flex-col">
            <div className="rounded-lg border border-border bg-background p-1">
              <div className="grid grid-cols-2 gap-1">
                <button
                  className={cn(
                    "rounded-md px-4 py-3 text-sm font-medium transition-colors",
                    authMode === "login" || authMode === "recover"
                      ? "bg-panel-ink text-panel-ivory"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                  onClick={() => switchMode("login")}
                  type="button"
                >
                  Entrar
                </button>
                <button
                  className={cn(
                    "rounded-md px-4 py-3 text-sm font-medium transition-colors",
                    authMode === "register"
                      ? "bg-panel-ink text-panel-ivory"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                  onClick={() => switchMode("register")}
                  type="button"
                >
                  Crear cuenta
                </button>
              </div>
            </div>

            <div className="mt-8">
              {authMode === "login" ? (
                <AuthHeader title="Iniciar sesion" description="Accede al panel operativo con tu correo principal." />
              ) : null}
              {authMode === "register" ? (
                <AuthHeader title="Crear cuenta" description="Registra el negocio y entra directo al panel al terminar." />
              ) : null}
              {authMode === "recover" ? (
                <AuthHeader title="Recuperar acceso" description="Inicia el flujo para restaurar el acceso al correo registrado." />
              ) : null}
            </div>

            {authStatus ? <StatusAlert className="mt-6" message={authStatus.message} tone={authStatus.tone} /> : null}

            {authMode === "login" ? (
              <LoginForm
                authBusy={authBusy}
                errors={loginErrors}
                onChange={setLoginValues}
                onRecover={() => switchMode("recover")}
                onSubmit={submitLogin}
                values={loginValues}
              />
            ) : null}

            {authMode === "register" ? (
              <RegisterForm
                authBusy={authBusy}
                errors={registerErrors}
                onChange={setRegisterValues}
                onRecoverExisting={() => {
                  setLoginValues((current) => ({ ...current, email: registerValues.email }));
                  switchMode("recover");
                }}
                onSubmit={submitRegister}
                values={registerValues}
              />
            ) : null}

            {authMode === "recover" ? (
              <RecoverForm
                authBusy={authBusy}
                onBack={() => switchMode("login")}
                onChange={setLoginValues}
                onSubmit={submitRecover}
                values={loginValues}
              />
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
