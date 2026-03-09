import type { AuthResult, AuthUser } from "@/types/auth";

type StoredUser = AuthUser & {
  password: string;
};

type StoredSession = {
  token: string;
  userId: string;
};

type AuthFailureCode =
  | "invalid_credentials"
  | "email_exists"
  | "network_error"
  | "server_error"
  | "not_found";

type ResetResult =
  | { ok: true; message: string }
  | { ok: false; code: AuthFailureCode; message: string };

const USERS_KEY = "whatsflow.auth.users";
const SESSION_KEY = "whatsflow.auth.session";

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function readSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

function writeSession(session: StoredSession | null) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function sanitizeUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
  };
}

function simulateLatency() {
  return new Promise((resolve) => setTimeout(resolve, 450));
}

function maybeFailNetwork() {
  const shouldFail = false;
  if (shouldFail) {
    throw new Error("network_error");
  }
}

export async function getSessionUser(): Promise<AuthUser | null> {
  await simulateLatency();
  const session = readSession();
  if (!session) return null;

  const user = readUsers().find((item) => item.id === session.userId);
  if (!user) {
    writeSession(null);
    return null;
  }

  return sanitizeUser(user);
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  await simulateLatency();

  try {
    maybeFailNetwork();
    const users = readUsers();
    const user = users.find((item) => item.email.toLowerCase() === input.email.toLowerCase());

    if (!user || user.password !== input.password) {
      return {
        ok: false,
        code: "invalid_credentials",
        message: "El email o la contrasena no coinciden.",
      };
    }

    writeSession({
      token: `wf_${user.id}_${Date.now()}`,
      userId: user.id,
    });

    return { ok: true, user: sanitizeUser(user) };
  } catch (error) {
    return {
      ok: false,
      code: error instanceof Error && error.message === "network_error" ? "network_error" : "server_error",
      message:
        error instanceof Error && error.message === "network_error"
          ? "No se pudo conectar con el servicio. Intenta de nuevo."
          : "Hubo un problema al iniciar sesion. Intenta de nuevo.",
    };
  }
}

export async function register(input: {
  name?: string;
  phone?: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  await simulateLatency();

  try {
    maybeFailNetwork();
    const users = readUsers();
    const existing = users.find((item) => item.email.toLowerCase() === input.email.toLowerCase());

    if (existing) {
      return {
        ok: false,
        code: "email_exists",
        message: "Ese correo ya tiene una cuenta. Puedes recuperar el acceso.",
      };
    }

    const user: StoredUser = {
      id: crypto.randomUUID(),
      email: input.email.trim().toLowerCase(),
      password: input.password,
      name: input.name?.trim() || undefined,
      phone: input.phone?.trim() || undefined,
    };

    users.push(user);
    writeUsers(users);
    writeSession({
      token: `wf_${user.id}_${Date.now()}`,
      userId: user.id,
    });

    return { ok: true, user: sanitizeUser(user) };
  } catch (error) {
    return {
      ok: false,
      code: error instanceof Error && error.message === "network_error" ? "network_error" : "server_error",
      message:
        error instanceof Error && error.message === "network_error"
          ? "No se pudo conectar con el servicio. Intenta de nuevo."
          : "No se pudo completar el registro. Intenta de nuevo.",
    };
  }
}

export async function requestPasswordReset(input: { email: string }): Promise<ResetResult> {
  await simulateLatency();

  try {
    maybeFailNetwork();
    const user = readUsers().find((item) => item.email.toLowerCase() === input.email.toLowerCase());

    if (!user) {
      return {
        ok: false,
        code: "not_found",
        message: "No encontramos una cuenta con ese correo.",
      };
    }

    return {
      ok: true,
      message: "Se preparo la recuperacion de acceso para ese correo.",
    };
  } catch (error) {
    return {
      ok: false,
      code: error instanceof Error && error.message === "network_error" ? "network_error" : "server_error",
      message:
        error instanceof Error && error.message === "network_error"
          ? "No se pudo conectar con el servicio. Intenta de nuevo."
          : "No se pudo iniciar la recuperacion. Intenta de nuevo.",
    };
  }
}

export async function logout() {
  await simulateLatency();
  writeSession(null);
}
