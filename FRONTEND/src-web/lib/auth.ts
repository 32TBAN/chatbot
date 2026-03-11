import { apiRequest } from "@/lib/api";
import type { AuthResult, AuthUser, RegisterResult } from "@/types/auth";

type StoredSession = {
  token: string;
};

type BackendUser = {
  id: string;
  email: string;
  name?: string | null;
  businessId?: string | null;
  role?: string | null;
  business?: {
    id?: string | null;
    name?: string | null;
  } | null;
};

type LoginResponse = {
  accessToken?: string;
  user?: BackendUser;
};

type ErrorResponse = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

type AuthFailureCode =
  | "invalid_credentials"
  | "network_error"
  | "server_error"
  | "config_error";

type RegisterFailureCode =
  | "duplicate_email"
  | "network_error"
  | "server_error"
  | "config_error";

const SESSION_KEY = "whatsflow.auth.session";

function readSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export function getSessionToken() {
  return readSession()?.token ?? null;
}

function writeSession(session: StoredSession | null) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function mapUser(user: BackendUser | null | undefined): AuthUser | null {
  if (!user?.id || !user.email) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name ?? undefined,
    businessId: user.businessId ?? undefined,
    role: user.role ?? undefined,
    business: user.business
      ? {
          id: user.business.id ?? undefined,
          name: user.business.name ?? undefined,
        }
      : undefined,
  };
}

async function parseJson<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return null;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function mapFailure(code: AuthFailureCode): AuthResult {
  switch (code) {
    case "config_error":
      return {
        ok: false,
        code,
        message: "Falta configurar VITE_API_URL para conectar con el backend.",
      };
    case "invalid_credentials":
      return {
        ok: false,
        code,
        message: "El email o la contrasena no coinciden.",
      };
    case "network_error":
      return {
        ok: false,
        code,
        message: "No se pudo conectar con el backend. Verifica la API e intenta de nuevo.",
      };
    default:
      return {
        ok: false,
        code: "server_error",
        message: "Hubo un problema al iniciar sesion. Intenta de nuevo.",
      };
  }
}

function mapRegisterFailure(code: RegisterFailureCode): RegisterResult {
  switch (code) {
    case "config_error":
      return {
        ok: false,
        code,
        message: "Falta configurar VITE_API_URL para conectar con el backend.",
      };
    case "duplicate_email":
      return {
        ok: false,
        code,
        message: "Ese correo ya esta registrado.",
      };
    case "network_error":
      return {
        ok: false,
        code,
        message: "No se pudo conectar con el backend. Verifica la API e intenta de nuevo.",
      };
    default:
      return {
        ok: false,
        code: "server_error",
        message: "Hubo un problema al crear la cuenta. Intenta de nuevo.",
      };
  }
}

function isDuplicateEmail(response: Response, data: ErrorResponse | null) {
  if (response.status === 409) {
    return true;
  }

  const message = Array.isArray(data?.message) ? data.message.join(" ") : data?.message ?? "";
  return /exists|duplicate|already|registrado|uso/i.test(message);
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const session = readSession();
  if (!session?.token) {
    return null;
  }

  try {
    const response = await apiRequest("/auth/me", {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    if (!response.ok) {
      writeSession(null);
      return null;
    }

    const user = mapUser(await parseJson<BackendUser>(response));

    if (!user) {
      writeSession(null);
      return null;
    }

    return user;
  } catch (error) {
    if (error instanceof Error && error.message === "api_url_missing") {
      writeSession(null);
      return null;
    }

    if (error instanceof Error && error.message === "network_error") {
      return null;
    }

    writeSession(null);
    return null;
  }
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  try {
    const response = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: input.email.trim(),
        password: input.password,
      }),
    });

    if (response.status === 401) {
      return mapFailure("invalid_credentials");
    }

    if (!response.ok) {
      return mapFailure("server_error");
    }

    const data = await parseJson<LoginResponse>(response);
    const token = data?.accessToken;
    const user = mapUser(data?.user);

    if (!token || !user) {
      writeSession(null);
      return mapFailure("server_error");
    }

    writeSession({ token });
    return { ok: true, user };
  } catch (error) {
    writeSession(null);

    if (error instanceof Error && error.message === "api_url_missing") {
      return mapFailure("config_error");
    }

    if (error instanceof Error && error.message === "network_error") {
      return mapFailure("network_error");
    }

    return mapFailure("server_error");
  }
}

export async function register(input: {
  name: string;
  phone?: string;
  email: string;
  password: string;
}): Promise<RegisterResult> {
  try {
    const response = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: input.name.trim(),
        phone: input.phone?.trim() || undefined,
        email: input.email.trim(),
        password: input.password,
      }),
    });

    if (!response.ok) {
      const errorData = await parseJson<ErrorResponse>(response);
      if (isDuplicateEmail(response, errorData)) {
        return mapRegisterFailure("duplicate_email");
      }

      return mapRegisterFailure("server_error");
    }

    const data = await parseJson<LoginResponse>(response);
    const token = data?.accessToken;
    const user = mapUser(data?.user);

    if (token && user) {
      writeSession({ token });
      return { ok: true, email: user.email, user };
    }

    writeSession(null);
    return { ok: true, email: input.email.trim() };
  } catch (error) {
    writeSession(null);

    if (error instanceof Error && error.message === "api_url_missing") {
      return mapRegisterFailure("config_error");
    }

    if (error instanceof Error && error.message === "network_error") {
      return mapRegisterFailure("network_error");
    }

    return mapRegisterFailure("server_error");
  }
}

export async function logout() {
  writeSession(null);
}
