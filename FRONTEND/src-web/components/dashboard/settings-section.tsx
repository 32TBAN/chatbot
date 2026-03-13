import {
  ArrowRight,
  Building2,
  Globe2,
  ImagePlus,
  Mail,
  MapPin,
  Phone,
  Plus,
  ShieldBan,
  Store,
  Text,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getBusinessSettings, updateBusinessSettings, uploadWelcomeLogo } from "@/services/business-settings-service";
import { createBusiness, getMyBusiness, updateBusiness } from "@/services/business-service";
import { useAuth } from "@/contexts/auth-context";
import type { BusinessSettingsView, TargetingMode } from "@/lib/business-settings";
import type { BusinessProfile } from "@/lib/business";
import type { AuthUser } from "@/types/auth";

const INDUSTRY_OPTIONS = [
  { value: "salud", label: "Salud" },
  { value: "retail", label: "Retail" },
  { value: "educacion", label: "Educacion" },
  { value: "restaurante", label: "Restaurante" },
  { value: "servicios", label: "Servicios" },
  { value: "belleza", label: "Belleza" },
  { value: "otro", label: "Otro" },
] as const;

const COUNTRY_OPTIONS = [
  { code: "EC", label: "Ecuador", dialCode: "+593" },
  { code: "CO", label: "Colombia", dialCode: "+57" },
  { code: "PE", label: "Peru", dialCode: "+51" },
  { code: "MX", label: "Mexico", dialCode: "+52" },
  { code: "US", label: "Estados Unidos", dialCode: "+1" },
] as const;

const TARGETING_MODE_OPTIONS: Array<{ description: string; value: TargetingMode; label: string }> = [
  {
    value: "all",
    label: "Sin restriccion",
    description: "El bot responde a cualquier numero que escriba al WhatsApp del negocio.",
  },
  {
    value: "exclude",
    label: "Enviar a todos excepto",
    description: "Bloquea respuestas automaticas para los numeros que agregues a la lista.",
  },
  {
    value: "allow_only",
    label: "Enviar solo a",
    description: "Permite respuestas automaticas unicamente a los numeros de la lista.",
  },
];

const DEFAULT_SETTINGS: BusinessSettingsView = {
  targetingMode: "all",
  targetingNumbers: [],
  welcomeLogoUrl: null,
  welcomeLogoFilename: null,
  locationLatitude: null,
  locationLongitude: null,
  locationLabel: null,
  locationAddress: null,
  locationGoogleMapsUrl: null,
};

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

function normalizeLocalPhone(value: string) {
  return value.replace(/\D+/g, "").replace(/^0+/, "");
}

function buildNormalizedPhone(dialCode: string, rawPhone: string) {
  const localNumber = normalizeLocalPhone(rawPhone);
  const normalizedDialCode = dialCode.replace(/\D+/g, "");

  if (!normalizedDialCode || localNumber.length < 6) {
    return null;
  }

  return `+${normalizedDialCode}${localNumber}`;
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
  const [targetingMode, setTargetingMode] = useState<TargetingMode>(DEFAULT_SETTINGS.targetingMode);
  const [targetingNumbers, setTargetingNumbers] = useState<string[]>(DEFAULT_SETTINGS.targetingNumbers);
  const [selectedCountryCode, setSelectedCountryCode] = useState<(typeof COUNTRY_OPTIONS)[number]["code"]>("EC");
  const [welcomeLogoUrl, setWelcomeLogoUrl] = useState<string | null>(DEFAULT_SETTINGS.welcomeLogoUrl);
  const [welcomeLogoFilename, setWelcomeLogoFilename] = useState<string | null>(DEFAULT_SETTINGS.welcomeLogoFilename);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [targetingDraft, setTargetingDraft] = useState("");
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
      setTargetingMode(DEFAULT_SETTINGS.targetingMode);
      setTargetingNumbers(DEFAULT_SETTINGS.targetingNumbers);
      setWelcomeLogoUrl(DEFAULT_SETTINGS.welcomeLogoUrl);
      setWelcomeLogoFilename(DEFAULT_SETTINGS.welcomeLogoFilename);
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

      const [businessResult, settingsResult] = await Promise.all([
        getMyBusiness(token),
        getBusinessSettings(token),
      ]);
      if (cancelled) return;

      setIsLoadingBusiness(false);

      if (!businessResult.ok) {
        setLoadError(businessResult.message);
        return;
      }

      if (!settingsResult.ok) {
        setLoadError(settingsResult.message);
        return;
      }

      const hydrated = hydrateFormFromBusiness(businessResult.business);
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
      setTargetingMode(settingsResult.settings.targetingMode);
      setTargetingNumbers(settingsResult.settings.targetingNumbers);
      setWelcomeLogoUrl(settingsResult.settings.welcomeLogoUrl);
      setWelcomeLogoFilename(settingsResult.settings.welcomeLogoFilename);
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
  const selectedCountry = COUNTRY_OPTIONS.find((option) => option.code === selectedCountryCode) ?? COUNTRY_OPTIONS[0];
  const usesTargetingList = targetingMode !== "all";

  const addTargetingNumber = () => {
    setFormError(null);
    setFormSuccess(null);

    const normalized = buildNormalizedPhone(selectedCountry.dialCode, targetingDraft);
    if (!normalized) {
      setFormError("Ingresa un numero valido para agregar a la lista.");
      return;
    }

    if (targetingNumbers.includes(normalized)) {
      setFormError("Ese numero ya esta agregado en la lista.");
      return;
    }

    setTargetingNumbers((current) => [...current, normalized]);
    setTargetingDraft("");
  };

  const removeTargetingNumber = (value: string) => {
    setTargetingNumbers((current) => current.filter((item) => item !== value));
  };

  const handleWelcomeLogoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const token = getAccessToken();
    if (!token) {
      setFormError("No hay una sesion valida para subir el logo de bienvenida.");
      return;
    }

    setFormError(null);
    setFormSuccess(null);
    setIsUploadingLogo(true);

    const result = await uploadWelcomeLogo(token, file);
    setIsUploadingLogo(false);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    setWelcomeLogoUrl(result.settings.welcomeLogoUrl);
    setWelcomeLogoFilename(result.settings.welcomeLogoFilename);
    setFormSuccess("Logo de bienvenida actualizado correctamente.");
  };

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

    const businessResult = isEditing && sessionUser.businessId
      ? await updateBusiness({
          id: sessionUser.businessId,
          ...payload,
        })
      : await createBusiness(payload);

    if (!businessResult.ok) {
      setIsSaving(false);

      if (!isEditing && businessResult.code === "conflict") {
        const refreshed = await refreshSession();
        if (refreshed) {
          onBusinessCreated();
          return;
        }
      }

      setFormError(businessResult.message);
      return;
    }

    const refreshed = await refreshSession();
    if (!refreshed) {
      setSessionUser((current) =>
        current
          ? {
              ...current,
              businessId: businessResult.business.id,
              business: {
                id: businessResult.business.id,
                name: businessResult.business.name,
              },
            }
          : current,
      );
    }

    const settingsToken = getAccessToken();
    if (!settingsToken) {
      setIsSaving(false);
      setFormError("No se pudo obtener una sesion valida para guardar la configuracion de envio.");
      return;
    }

    const settingsResult = await updateBusinessSettings(settingsToken, {
      targetingMode,
      targetingNumbers,
    });

    setIsSaving(false);

    if (!settingsResult.ok) {
      setFormError(`${isEditing ? "El negocio se actualizo" : "El negocio se guardo"}, pero no se pudo guardar la configuracion de envio.`);
      return;
    }

    setFormSuccess(isEditing ? "Negocio y configuracion de envio actualizados correctamente." : "Negocio y configuracion de envio guardados correctamente.");

    const hydrated = hydrateFormFromBusiness(businessResult.business);
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
    setTargetingMode(settingsResult.settings.targetingMode);
    setTargetingNumbers(settingsResult.settings.targetingNumbers);
      setWelcomeLogoUrl(settingsResult.settings.welcomeLogoUrl);
      setWelcomeLogoFilename(settingsResult.settings.welcomeLogoFilename);

    if (!isEditing) {
      onBusinessCreated();
    }
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

            <div className="grid gap-4 rounded-[1.35rem] border border-border/80 bg-[linear-gradient(180deg,rgba(251,248,241,0.95),rgba(243,245,240,0.9))] p-5 shadow-sm">
              <div className="grid gap-2">
                <label className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  <ImagePlus className="h-3.5 w-3.5" />
                  Logo de bienvenida
                </label>
                <p className="text-sm leading-6 text-muted-foreground">
                  Este logo se enviara en el primer saludo cuando el cliente ya haya respondido como quiere que lo llamen.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-start">
                <div className="grid gap-3">
                  <Input accept="image/*" disabled={isBusy || isUploadingLogo || !isEditing} onChange={handleWelcomeLogoChange} type="file" />
                  <p className="text-xs text-muted-foreground">
                    {isEditing
                      ? isUploadingLogo
                        ? "Subiendo logo..."
                        : welcomeLogoFilename
                          ? "Archivo actual: " + welcomeLogoFilename
                          : "Aun no hay un logo cargado para la bienvenida."
                      : "Guarda primero el negocio para habilitar la carga del logo."}
                  </p>
                </div>
                <div className="overflow-hidden rounded-2xl border border-border bg-background/80">
                  {welcomeLogoUrl ? (
                    <img alt="Logo de bienvenida" className="h-44 w-full object-cover" src={welcomeLogoUrl} />
                  ) : (
                    <div className="grid h-44 place-items-center px-6 text-center text-sm text-muted-foreground">
                      Vista previa del logo de bienvenida
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 rounded-[1.35rem] border border-border/80 bg-[linear-gradient(180deg,rgba(251,248,241,0.95),rgba(243,245,240,0.9))] p-5 shadow-sm">
              <div className="grid gap-2">
                <label className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  <ShieldBan className="h-3.5 w-3.5" />
                  Restriccion de numeros para respuestas reales
                </label>
                <p className="text-sm leading-6 text-muted-foreground">
                  Define si el bot puede responder a todos los numeros, excluir algunos o permitir solo una lista especifica.
                  Esta regla aplica solo a envios reales del bot, no al modulo Debug.
                </p>
              </div>

              <div className="grid gap-4">
                {TARGETING_MODE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                      targetingMode === option.value
                        ? "border-panel-steel/40 bg-panel-signal/25"
                        : "border-border bg-background/75 hover:bg-muted/30"
                    }`}
                    disabled={isBusy}
                    onClick={() => setTargetingMode(option.value)}
                    type="button"
                  >
                    <p className="text-sm font-medium text-panel-ink">{option.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{option.description}</p>
                  </button>
                ))}
              </div>

              {usesTargetingList ? (
                <div className="grid gap-4 rounded-2xl border border-border bg-background/80 p-4">
                  <div className="grid gap-3 lg:grid-cols-[190px_minmax(0,1fr)_auto] lg:items-end">
                    <Field label="Pais / prefijo" icon={Globe2}>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-muted/45 px-3 py-2 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50"
                        disabled={isBusy}
                        onChange={(event) => setSelectedCountryCode(event.target.value as (typeof COUNTRY_OPTIONS)[number]["code"])}
                        value={selectedCountryCode}
                      >
                        {COUNTRY_OPTIONS.map((option) => (
                          <option key={option.code} value={option.code}>
                            {option.label} ({option.dialCode})
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Numero" icon={Phone}>
                      <Input
                        disabled={isBusy}
                        onChange={(event) => setTargetingDraft(event.target.value)}
                        placeholder="Ej. 987654321"
                        value={targetingDraft}
                      />
                    </Field>
                    <Button disabled={isBusy} onClick={addTargetingNumber} type="button" variant="secondary">
                      <Plus className="h-4 w-4" />
                      Agregar
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Los numeros se guardan normalizados con el prefijo del pais seleccionado. Prefijo actual: {selectedCountry.dialCode}
                  </p>

                  {targetingNumbers.length ? (
                    <div className="flex flex-wrap gap-2">
                      {targetingNumbers.map((value) => (
                        <Badge className="flex items-center gap-2 px-3 py-2" key={value} variant="default">
                          <span>{value}</span>
                          <button
                            className="rounded-full text-current transition-opacity hover:opacity-70"
                            disabled={isBusy}
                            onClick={() => removeTargetingNumber(value)}
                            type="button"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border px-4 py-4 text-sm text-muted-foreground">
                      Aun no hay numeros agregados para esta regla.
                    </div>
                  )}
                </div>
              ) : null}
            </div>

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





