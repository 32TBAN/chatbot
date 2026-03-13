import { apiRequest } from "@/lib/api";

export type ProductMediaType = "image" | "video";

export type ProductView = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string | null;
  stock: number | null;
  isActive: boolean;
  mediaType: ProductMediaType | null;
  mediaUrl: string | null;
  mediaFilename: string | null;
  whatsappCaption: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type ProductResponse = Partial<ProductView> & { id: string; name: string };

type ProductsResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: "config_error" | "network_error" | "server_error"; message: string };

function toNullableNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function mapProduct(item: ProductResponse): ProductView {
  return {
    id: item.id,
    name: item.name,
    description: item.description ?? null,
    price: toNullableNumber(item.price),
    currency: item.currency ?? null,
    stock: toNullableNumber(item.stock),
    isActive: Boolean(item.isActive ?? true),
    mediaType: item.mediaType === "image" || item.mediaType === "video" ? item.mediaType : null,
    mediaUrl: item.mediaUrl ?? null,
    mediaFilename: item.mediaFilename ?? null,
    whatsappCaption: item.whatsappCaption ?? null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

async function requestProducts<T>(path: string, token: string, init?: RequestInit): Promise<ProductsResult<T>> {
  try {
    const response = await apiRequest(path, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      return {
        ok: false,
        code: "server_error",
        message: "No se pudo completar la operacion del catalogo.",
      };
    }

    const data = response.status === 204 ? null : await response.json();
    return { ok: true, data: data as T };
  } catch (error) {
    if (error instanceof Error && error.message === "api_url_missing") {
      return {
        ok: false,
        code: "config_error",
        message: "Falta configurar VITE_API_URL para conectar con el backend.",
      };
    }

    return {
      ok: false,
      code: "network_error",
      message: "No se pudo conectar con el backend para el catalogo.",
    };
  }
}

export function getProducts(token: string) {
  return requestProducts<ProductResponse[]>("/products", token).then((result) =>
    result.ok ? { ok: true as const, data: result.data.map(mapProduct) } : result,
  );
}

export function createProduct(token: string, input: Omit<ProductView, "id" | "mediaUrl" | "mediaFilename" | "createdAt" | "updatedAt">) {
  return requestProducts<ProductResponse>("/products", token, {
    method: "POST",
    body: JSON.stringify(input),
  }).then((result) => (result.ok ? { ok: true as const, data: mapProduct(result.data) } : result));
}

export function updateProduct(token: string, id: string, input: Partial<ProductView>) {
  return requestProducts<ProductResponse>(`/products/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(input),
  }).then((result) => (result.ok ? { ok: true as const, data: mapProduct(result.data) } : result));
}

export function deleteProduct(token: string, id: string) {
  return requestProducts<null>(`/products/${id}`, token, {
    method: "DELETE",
  });
}

export function uploadProductMedia(token: string, id: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return requestProducts<ProductResponse>(`/products/${id}/media`, token, {
    method: "POST",
    body: formData,
  }).then((result) => (result.ok ? { ok: true as const, data: mapProduct(result.data) } : result));
}
