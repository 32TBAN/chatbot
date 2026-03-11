import { apiRequest } from "@/lib/api";

export type CreateBusinessInput = {
  name: string;
  slug: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  industry?: string;
  timezone?: string;
  token: string;
};

export type CreateBusinessResult =
  | {
      ok: true;
      business: {
        id: string;
        name: string;
      };
    }
  | {
      ok: false;
      code: "conflict" | "network_error" | "server_error" | "config_error";
      message: string;
    };

type BusinessResponse = {
  id?: string;
  name?: string;
};

export async function createBusiness(input: CreateBusinessInput): Promise<CreateBusinessResult> {
  try {
    const response = await apiRequest("/businesses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.token}`,
      },
      body: JSON.stringify({
        name: input.name.trim(),
        slug: input.slug.trim(),
        description: input.description?.trim() || undefined,
        phone: input.phone?.trim() || undefined,
        email: input.email?.trim() || undefined,
        address: input.address?.trim() || undefined,
        industry: input.industry?.trim() || undefined,
        timezone: input.timezone?.trim() || undefined,
      }),
    });

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

    const data = (await response.json()) as BusinessResponse;
    if (!data?.id || !data?.name) {
      return {
        ok: false,
        code: "server_error",
        message: "La respuesta del negocio no fue valida.",
      };
    }

    return {
      ok: true,
      business: {
        id: data.id,
        name: data.name,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.message === "api_url_missing") {
      return {
        ok: false,
        code: "config_error",
        message: "Falta configurar VITE_API_URL para conectar con el backend.",
      };
    }

    if (error instanceof Error && error.message === "network_error") {
      return {
        ok: false,
        code: "network_error",
        message: "No se pudo conectar con el backend. Verifica la API e intenta de nuevo.",
      };
    }

    return {
      ok: false,
      code: "server_error",
      message: "No se pudo guardar el negocio. Intenta de nuevo.",
    };
  }
}
