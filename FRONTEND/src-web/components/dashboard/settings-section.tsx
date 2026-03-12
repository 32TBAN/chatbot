import { ArrowRight, Building2, Globe2, Mail, MapPin, Phone, Store, Text, Workflow, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createBusiness, getMyBusiness, updateBusiness } from "@/services/business-service";
import { useAuth } from "@/contexts/auth-context";
import type { AuthUser } from "@/types/auth";
import type { BusinessProfile } from "@/lib/business";

const INDUSTRY_OPTIONS = [
  { value: "salud", label: "Salud" },
  { value: "retail", label: "Retail" },
  { value: "educacion", label: "Educacion" },
  { value: "restaurante", label: "Restaurante" },
  { value: "servicios", label: "Servicios" },
  { value: "belleza", label: "Belleza" },
  { value: "otro", label: "Otro" },
] as const;

const KNOWN_INDUSTRIES = new Set<string>(INDUSTRY_OPTIONS.map((option) => option.value).filter((value) => value !== "otro"));

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function mapIndustry(industry?: string) {
  const value = industry?.trim().toLowerCase();
  if (!value) {
    return { industry: "", customIndustry: "" };
  }

  if (KNOWN_INDUSTRIES.has(value)) {
    return { industry: value, customIndustry: "" };
  }

  return { industry: "otro", customIndustry: industry?.trim() ?? "" };
}

function hydrateFormFromBusiness(business: BusinessProfile) {
  const mappedIndustry = mapIndustry(business.industry);

  return {
    name: business.name,
    email: business.email ?? "",
    description: business.description ?? "",
    address: business.address ?? "",
    slug: business.slug,
    timezone: business.timezone ?? "",
    showPhoneField: Boolean(business.phone),
    phone: business.phone ?? "",
    industry: mappedIndustry.industry,
    customIndustry: mappedIndustry.customIndustry,
  };
}

export function SettingsSection({
  focusFormSignal,
  onBusinessCreated,
  sessionUser,
  setupIncomplete,
}: {
  focusFormSignal: number;
  onBusinessCreated: () => void;
  sessionUser: AuthUser;
  setupIncomplete: boolean;
}) {
  const { getAccessToken, refreshSession, setSessionUser } = useAuth();
  const [businessName, setBusinessName] = useState(sessionUser.business?.name ?? "");
  const [businessEmail, setBusinessEmail] = useState(sessionUser.email);
  const [businessDescription, setBusinessDescription] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessSlug, setBusinessSlug] = useState("");
  const [timezone, setTimezone] = useState("");
  const [showPhoneField, setShowPhoneField] = useState(false);
  const [businessPhone, setBusinessPhone] = useState("");
  const [industry, setIndustry] = useState("");
  const [customIndustry, setCustomIndustry] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingBusiness, setIsLoadingBusiness] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const formRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!detectedTimezone) return;

    setTimezone((current) => current || detectedTimezone);
  }, []);

  useEffect(() => {
    if (!focusFormSignal) return;

    formRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [focusFormSignal]);

  useEffect(() => {
    const businessId = sessionUser.businessId;
    const token = getAccessToken();

    if (!businessId) {
      setLoadError(null);
      setIsLoadingBusiness(false);
      return;
    }

    if (!token) {
      setLoadError("No hay una sesion valida para cargar el negocio.");
      setIsLoadingBusiness(false);
      return;
    }

    let cancelled = false;

    const loadBusiness = async () => {
      setIsLoadingBusiness(true);
      setLoadError(null);
      setFormError(null);
      setFormSuccess(null);

      const result = await getMyBusiness(token);
      if (cancelled) return;

      setIsLoadingBusiness(false);

      if (!result.ok) {
        setLoadError(result.message);
        return;
      }

      const hydrated = hydrateFormFromBusiness(result.business);
      setBusinessName(hydrated.name);
      setBusinessEmail(hydrated.email || sessionUser.email);
      setBusinessDescription(hydrated.description);
      setBusinessAddress(hydrated.address);
      setBusinessSlug(hydrated.slug);
      setTimezone(hydrated.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "");
      setShowPhoneField(hydrated.showPhoneField);
      setBusinessPhone(hydrated.phone);
      setIndustry(hydrated.industry);
      setCustomIndustry(hydrated.customIndustry);
    };

    void loadBusiness();

    return () => {
      cancelled = true;
    };
  }, [getAccessToken, loadAttempt, sessionUser.businessId, sessionUser.email]);

  const slugValue = useMemo(() => normalizeSlug(businessSlug), [businessSlug]);
  const finalIndustry = industry === "otro" ? customIndustry.trim() : industry;
  const isEditing = Boolean(sessionUser.businessId);
  const isBusy = isSaving || isLoadingBusiness;

  const handleSubmit = async () => {
    setFormError(null);
    setFormSuccess(null);

    if (!businessName.trim()) {
      setFormError("Ingresa el nombre del negocio.");
      return;
    }

    if (!businessEmail.trim()) {
      setFormError("Ingresa el correo del negocio.");
      return;
    }

    if (!slugValue) {
      setFormError("Ingresa un slug o pagina web valida.");
      return;
    }

    if (!industry) {
      setFormError("Selecciona la industria del negocio.");
      return;
    }

    if (industry === "otro" && !customIndustry.trim()) {
      setFormError("Escribe la industria del negocio.");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setFormError(
        isEditing ? "No hay una sesion valida para actualizar el negocio." : "No hay una sesion valida para crear el negocio.",
      );
      return;
    }

    setIsSaving(true);

    const payload = {
      name: businessName,
      slug: slugValue,
      description: businessDescription,
      phone: showPhoneField ? businessPhone : undefined,
      email: businessEmail,
      address: businessAddress,
      industry: finalIndustry,
      timezone,
      token,
    };

    const result = isEditing && sessionUser.businessId
      ? await updateBusiness({
          id: sessionUser.businessId,
          ...payload,
        })
      : await createBusiness(payload);

    setIsSaving(false);

    if (!result.ok) {
      if (!isEditing && result.code === "conflict") {
        const refreshed = await refreshSession();
        if (refreshed) {
          onBusinessCreated();
          return;
        }
      }

      setFormError(result.message);
      return;
    }

    const refreshed = await refreshSession();
    if (!refreshed) {
      setSessionUser((current) =>
        current
          ? {
              ...current,
              businessId: result.business.id,
              business: {
                id: result.business.id,
                name: result.business.name,
              },
            }
          : current,
      );
    }

    setFormSuccess(isEditing ? "Negocio actualizado correctamente." : "Negocio guardado correctamente.");

    if (!isEditing) {
      onBusinessCreated();
      return;
    }

    const hydrated = hydrateFormFromBusiness(result.business);
    setBusinessName(hydrated.name);
    setBusinessEmail(hydrated.email || sessionUser.email);
    setBusinessDescription(hydrated.description);
    setBusinessAddress(hydrated.address);
    setBusinessSlug(hydrated.slug);
    setTimezone(hydrated.timezone || timezone);
    setShowPhoneField(hydrated.showPhoneField);
    setBusinessPhone(hydrated.phone);
    setIndustry(hydrated.industry);
    setCustomIndustry(hydrated.customIndustry);
  };

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_340px]">
      <div className="grid gap-6">
        <Card className="border-amber-300/70 bg-card/95">
          <CardHeader className="border-amber-300/60 bg-amber-100/40">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardDescription>Configuracion del negocio</CardDescription>
                <CardTitle>
                  {setupIncomplete ? "Completa el perfil del negocio para continuar" : "Actualiza la informacion del negocio"}
                </CardTitle>
              </div>
              <Badge variant={setupIncomplete ? "warning" : "success"}>
                {setupIncomplete ? "Completar ahora" : "Negocio activo"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 py-5">
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Define la informacion principal del negocio. Con esto podras empezar a usar el panel con datos reales.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                "Automatizaciones listas para trabajar con datos reales.",
                "QR y canal principal preparados para la operacion.",
                "Agenda, catalogo e historial habilitados al completar el negocio.",
              ].map((item) => (
                <div key={item} className="rounded-lg border border-border bg-card px-4 py-4">
                  <p className="text-sm text-panel-ink">{item}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/95" id="business-setup-form" ref={formRef}>
          <CardHeader>
            <CardDescription>Datos del negocio</CardDescription>
            <CardTitle>{isEditing ? "Edita la informacion principal" : "Completa la informacion principal"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {isLoadingBusiness ? (
              <p className="text-sm text-muted-foreground">Cargando informacion del negocio...</p>
            ) : null}

            {loadError ? (
              <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-destructive">{loadError}</p>
                <Button onClick={() => setLoadAttempt((current) => current + 1)} type="button" variant="outline">
                  Reintentar
                </Button>
              </div>
            ) : null}

            <Field label="Nombre del negocio" icon={Store}>
              <Input
                disabled={isBusy}
                onChange={(event) => setBusinessName(event.target.value)}
                placeholder="Ej. Clinica Norte o Tienda Delta"
                value={businessName}
              />
            </Field>

            <Field label="Correo del negocio" icon={Mail}>
              <Input
                disabled={isBusy}
                onChange={(event) => setBusinessEmail(event.target.value)}
                placeholder="negocio@dominio.com"
                value={businessEmail}
              />
            </Field>

            <Field label="Slug / pagina web" icon={Globe2}>
              <Input
                disabled={isBusy}
                onChange={(event) => setBusinessSlug(event.target.value)}
                placeholder="mi-negocio"
                value={businessSlug}
              />
              {slugValue ? <p className="text-xs text-muted-foreground">Se guardara como: {slugValue}</p> : null}
            </Field>

            <Field label="Industria" icon={Building2}>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-muted/45 px-3 py-2 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50"
                disabled={isBusy}
                onChange={(event) => setIndustry(event.target.value)}
                value={industry}
              >
                <option value="">Selecciona una industria</option>
                {INDUSTRY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            {industry === "otro" ? (
              <Field label="Otra industria" icon={Building2}>
                <Input
                  disabled={isBusy}
                  onChange={(event) => setCustomIndustry(event.target.value)}
                  placeholder="Escribe la industria"
                  value={customIndustry}
                />
              </Field>
            ) : null}

            <Field label="Zona horaria" icon={Workflow}>
              <Input disabled={isBusy} onChange={(event) => setTimezone(event.target.value)} value={timezone} />
            </Field>

            <Field label="Descripcion opcional" icon={Text}>
              <textarea
                className="min-h-[112px] w-full rounded-md border border-input bg-muted/45 px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50"
                disabled={isBusy}
                onChange={(event) => setBusinessDescription(event.target.value)}
                placeholder="Describe brevemente el negocio"
                value={businessDescription}
              />
            </Field>

            <Field label="Direccion opcional" icon={MapPin}>
              <Input
                disabled={isBusy}
                onChange={(event) => setBusinessAddress(event.target.value)}
                placeholder="Direccion del negocio"
                value={businessAddress}
              />
            </Field>

            {showPhoneField ? (
              <Field label="Telefono comercial opcional" icon={Phone}>
                <Input
                  disabled={isBusy}
                  onChange={(event) => setBusinessPhone(event.target.value)}
                  placeholder="+593..."
                  value={businessPhone}
                />
              </Field>
            ) : (
              <button
                className="flex items-center gap-2 text-sm text-panel-ink underline-offset-4 hover:underline disabled:pointer-events-none disabled:opacity-50"
                disabled={isBusy}
                onClick={() => setShowPhoneField(true)}
                type="button"
              >
                <Phone className="h-4 w-4" />
                Agregar telefono comercial
              </button>
            )}

            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
            {formSuccess ? <p className="text-sm text-success">{formSuccess}</p> : null}

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {isEditing
                  ? "Puedes actualizar estos datos en cualquier momento. Los cambios se guardan sobre el negocio actual."
                  : "Puedes completar mas ajustes despues. Lo importante aqui es dejar creado el negocio."}
              </p>
              <Button disabled={isBusy || Boolean(loadError)} onClick={handleSubmit} type="button">
                {isSaving ? (isEditing ? "Guardando cambios..." : "Guardando...") : isEditing ? "Guardar cambios" : "Guardar y continuar"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card className="bg-card/95">
          <CardHeader>
            <CardDescription>Despues de guardar</CardDescription>
            <CardTitle>Modulos que se habilitan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { icon: Workflow, label: "Automatizaciones y flujos" },
              { icon: Phone, label: "Conexion QR y canal principal" },
              { icon: Store, label: "Agenda, catalogo e historial" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3 rounded-lg border border-border px-4 py-4">
                  <div className="grid h-9 w-9 place-items-center rounded-md border border-border bg-muted/40">
                    <Icon className="h-4 w-4 text-panel-ink" />
                  </div>
                  <p className="text-sm text-panel-ink">{item.label}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function Field({
  children,
  icon: Icon,
  label,
}: {
  children: ReactNode;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div className="grid gap-2">
      <label className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </label>
      {children}
    </div>
  );
}
