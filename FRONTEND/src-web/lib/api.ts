const rawApiUrl = import.meta.env.VITE_API_URL;

function normalizeApiUrl(value: string) {
  return value.replace(/\/+$/, "");
}

export function getApiBaseUrl() {
  if (!rawApiUrl || typeof rawApiUrl !== "string" || !rawApiUrl.trim()) {
    throw new Error("api_url_missing");
  }

  return normalizeApiUrl(rawApiUrl.trim());
}

export function buildApiUrl(path: string) {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

export async function apiRequest(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    return await fetch(buildApiUrl(path), {
      ...init,
      headers,
    });
  } catch {
    throw new Error("network_error");
  }
}
