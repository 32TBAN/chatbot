import { apiRequest } from "@/lib/api";

export type BusinessProfile = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  industry?: string;
  timezone?: string;
};

type BusinessPayload = {
  name: string;
  slug: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  industry?: string;
  timezone?: string;
};

export type CreateBusinessInput = BusinessPayload & {
  token: string;
};

export type CreateBusinessResult =
  | {
      ok: true;
      business: BusinessProfile;
    }
  | {
      ok: false;
      code: "conflict" | "network_error" | "server_error" | "config_error" | "unauthorized";
      message: string;
    };

type BusinessResponse = {
  id?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  industry?: string | null;
  timezone?: string | null;
};

export type GetMyBusinessResult =
  | {
      ok: true;
      business: BusinessProfile;
    }
  | {
      ok: false;
      code: "network_error" | "server_error" | "config_error" | "unauthorized";
      message: string;
    };

export type UpdateBusinessInput = BusinessPayload & {
  id: string;
  token: string;
};

export type UpdateBusinessResult =
  | {
      ok: true;
      business: BusinessProfile;
    }
  | {
      ok: false;
      code: "network_error" | "server_error" | "config_error" | "unauthorized";
      message: string;
    };

function mapBusiness(data: BusinessResponse | null | undefined): BusinessProfile | null {
  if (!data?.id || !data.name || !data.slug) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description ?? undefined,
    phone: data.phone ?? undefined,
    email: data.email ?? undefined,
    address: data.address ?? undefined,
    industry: data.industry ?? undefined,
    timezone: data.timezone ?? undefined,
  };
}

function buildBusinessPayload(input: BusinessPayload) {
  return {
    name: input.name.trim(),
    slug: input.slug.trim(),
    description: input.description?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    email: input.email?.trim() || undefined,
    address: input.address?.trim() || undefined,
    industry: input.industry?.trim() || undefined,
    timezone: input.timezone?.trim() || undefined,
  };
}

export async function createBusiness(input: CreateBusinessInput): Promise<CreateBusinessResult> {
  try {
    const response = await apiRequest("/businesses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.token}`,
      },
      body: JSON.stringify(buildBusinessPayload(input)),
    });

    if (response.status === 401 || response.status === 403) {
      return {
        ok: false,
        code: "unauthorized",
        message: "Tu sesion expiro o ya no es valida. Inicia sesion nuevamente.",
      };
    }

    if (response.status === 409) {
      return {
        ok: false,
        code: "conflict",
        message: "La cuenta ya tiene un negocio registrado.",
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        code: "server_error",
        message: "No se pudo guardar el negocio. Intenta de nuevo.",
      };
    }

    const business = mapBusiness((await response.json()) as BusinessResponse);
    if (!business) {
      return {
        ok: false,
        code: "server_error",
        message: "La respuesta del negocio no fue valida.",
      };
    }

    return {
      ok: true,
      business,
    };
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
      message: "No se pudo guardar el negocio. Intenta de nuevo.",
    };
  }
}

export async function getMyBusiness(token: string): Promise<GetMyBusinessResult> {
  try {
    const response = await apiRequest("/businesses/me", {
      headers: {
        Authorization: `Bearer ${token}`,
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
        message: "No se pudo cargar la informacion del negocio.",
      };
    }

    const business = mapBusiness((await response.json()) as BusinessResponse);
    if (!business) {
      return {
        ok: false,
        code: "server_error",
        message: "La respuesta del negocio no fue valida.",
      };
    }

    return {
      ok: true,
      business,
    };
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
      message: "No se pudo cargar la informacion del negocio.",
    };
  }
}

export async function updateBusiness(input: UpdateBusinessInput): Promise<UpdateBusinessResult> {
  try {
    const response = await apiRequest(`/businesses/${input.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${input.token}`,
      },
      body: JSON.stringify(buildBusinessPayload(input)),
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
        message: "No se pudo actualizar el negocio. Intenta de nuevo.",
      };
    }

    const business = mapBusiness((await response.json()) as BusinessResponse);
    if (!business) {
      return {
        ok: false,
        code: "server_error",
        message: "La respuesta del negocio no fue valida.",
      };
    }

    return {
      ok: true,
      business,
    };
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
      message: "No se pudo actualizar el negocio. Intenta de nuevo.",
    };
  }
}

