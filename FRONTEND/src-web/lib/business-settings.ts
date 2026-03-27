import { apiRequest } from "@/lib/api";

export type TargetingMode = "all" | "exclude" | "allow_only";

export type BusinessSettingsView = {
  targetingMode: TargetingMode;
  targetingNumbers: string[];
  welcomeLogoUrl: string | null;
  welcomeLogoFilename: string | null;
  locationLatitude: number | null;
  locationLongitude: number | null;
  locationLabel: string | null;
  locationAddress: string | null;
  locationGoogleMapsUrl: string | null;
};

type BusinessSettingsResponse = {
  targetingMode?: string | null;
  targetingNumbers?: string[] | null;
  welcomeLogoUrl?: string | null;
  welcomeLogoFilename?: string | null;
  locationLatitude?: number | string | null;
  locationLongitude?: number | string | null;
  locationLabel?: string | null;
  locationAddress?: string | null;
  locationGoogleMapsUrl?: string | null;
};

type BusinessSettingsResult =
  | {
      ok: true;
      settings: BusinessSettingsView;
    }
  | {
      ok: false;
      code: "network_error" | "server_error" | "config_error" | "unauthorized";
      message: string;
    };

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

function toNullableNumber(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function mapBusinessSettings(data: BusinessSettingsResponse | null | undefined): BusinessSettingsView {
  const targetingMode = data?.targetingMode;
  return {
    targetingMode:
      targetingMode === "exclude" || targetingMode === "allow_only" || targetingMode === "all"
        ? targetingMode
        : DEFAULT_SETTINGS.targetingMode,
    targetingNumbers: Array.isArray(data?.targetingNumbers)
      ? data.targetingNumbers.map((value) => value.trim()).filter(Boolean)
      : [],
    welcomeLogoUrl: data?.welcomeLogoUrl ?? null,
    welcomeLogoFilename: data?.welcomeLogoFilename ?? null,
    locationLatitude: toNullableNumber(data?.locationLatitude),
    locationLongitude: toNullableNumber(data?.locationLongitude),
    locationLabel: data?.locationLabel?.trim() || null,
    locationAddress: data?.locationAddress?.trim() || null,
    locationGoogleMapsUrl: data?.locationGoogleMapsUrl?.trim() || null,
  };
}

async function requestBusinessSettings(token: string, init?: RequestInit): Promise<BusinessSettingsResult> {
  try {
    const response = await apiRequest("/business-settings", {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
    });

    if (response.status === 401 || response.status === 403) {
      return {
        ok: false,
        code: "unauthorized",
        message: "Tu sesion expiro o ya no es valida. Inicia sesion nuevamente.",
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        code: "server_error",
        message: init?.method === "PATCH"
          ? "No se pudo guardar la configuracion de envio."
          : "No se pudo cargar la configuracion de envio.",
      };
    }

    const payload = response.status === 204 ? null : (await response.json()) as BusinessSettingsResponse | null;
    return { ok: true, settings: mapBusinessSettings(payload) };
  } catch (error) {
    if (error instanceof Error && error.message === "api_url_missing") {
      return {
        ok: false,
        code: "config_error",
        message: "Falta conectar la API para que esta seccion funcione.",
      };
    }

    if (error instanceof Error && error.message === "network_error") {
      return {
        ok: false,
        code: "network_error",
        message: "No pudimos cargar esta informacion en este momento. Intenta otra vez.",
      };
    }

    return {
      ok: false,
      code: "server_error",
      message: init?.method === "PATCH"
        ? "No se pudo guardar la configuracion de envio."
        : "No se pudo cargar la configuracion de envio.",
    };
  }
}

export function getBusinessSettings(token: string) {
  return requestBusinessSettings(token);
}

export function updateBusinessSettings(
  token: string,
  input: Partial<BusinessSettingsView> & { targetingMode?: TargetingMode; targetingNumbers?: string[] },
) {
  return requestBusinessSettings(token, {
    method: "PATCH",
    body: JSON.stringify({
      targetingMode: input.targetingMode,
      targetingNumbers: input.targetingNumbers,
      locationLatitude: input.locationLatitude,
      locationLongitude: input.locationLongitude,
      locationLabel: input.locationLabel,
      locationAddress: input.locationAddress,
      locationGoogleMapsUrl: input.locationGoogleMapsUrl,
    }),
  });
}

export async function uploadWelcomeLogo(token: string, file: File): Promise<BusinessSettingsResult> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiRequest("/business-settings/welcome-logo", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (response.status === 401 || response.status === 403) {
      return {
        ok: false,
        code: "unauthorized",
        message: "Tu sesion expiro o ya no es valida. Inicia sesion nuevamente.",
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        code: "server_error",
        message: "No se pudo subir el logo de bienvenida.",
      };
    }

    return {
      ok: true,
      settings: mapBusinessSettings((await response.json()) as BusinessSettingsResponse),
    };
  } catch (error) {
    if (error instanceof Error && error.message === "api_url_missing") {
      return {
        ok: false,
        code: "config_error",
        message: "Falta conectar la API para que esta seccion funcione.",
      };
    }

    return {
      ok: false,
      code: "network_error",
      message: "No pudimos subir el logo en este momento.",
    };
  }
}

