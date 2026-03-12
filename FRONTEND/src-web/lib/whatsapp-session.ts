import { apiRequest } from "@/lib/api";

export type WhatsappSessionStatus = "pending" | "connected" | "paused" | "disconnected" | "expired";

export type WhatsappSessionView = {
  id: string | null;
  sessionKey: string | null;
  phoneNumber: string | null;
  qrCode: string | null;
  status: WhatsappSessionStatus | null;
  connectedAt: string | null;
  lastSeenAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  hasStoredCredentials: boolean;
  isRuntimeActive: boolean;
};

export type DebugConversationResult = {
  customer: {
    id: string;
    name: string | null;
    phone: string;
    source: string;
    isDebug: boolean;
  } | null;
  messages: Array<{
    id: string;
    direction: "inbound" | "outbound";
    messageType: string;
    content: string;
    sentAt: string;
  }>;
};

type WhatsappSessionResult =
  | {
      ok: true;
      session: WhatsappSessionView;
    }
  | {
      ok: false;
      code: "config_error" | "network_error" | "server_error";
      message: string;
    };

type DebugInboundResult =
  | {
      ok: true;
      conversation: DebugConversationResult;
    }
  | {
      ok: false;
      code: "config_error" | "network_error" | "server_error";
      message: string;
    };

async function requestSession(path: string, token: string, method = "GET"): Promise<WhatsappSessionResult> {
  try {
    const response = await apiRequest(path, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return {
        ok: false,
        code: "server_error",
        message: "No se pudo actualizar la sesion de WhatsApp.",
      };
    }

    const session = (await response.json()) as WhatsappSessionView;
    return {
      ok: true,
      session,
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
      message: "No se pudo actualizar la sesion de WhatsApp.",
    };
  }
}

export async function simulateWhatsappDebugInbound(
  token: string,
  input: { content: string; messageType?: "text" | "image" | "video" | "document" },
): Promise<DebugInboundResult> {
  try {
    const response = await apiRequest("/whatsapp-sessions/debug/inbound", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        content: input.content.trim(),
        messageType: input.messageType ?? "text",
      }),
    });

    if (!response.ok) {
      return {
        ok: false,
        code: "server_error",
        message: "No se pudo ejecutar la prueba de WhatsApp.",
      };
    }

    return {
      ok: true,
      conversation: (await response.json()) as DebugConversationResult,
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
      message: "No se pudo ejecutar la prueba de WhatsApp.",
    };
  }
}

export function getWhatsappSession(token: string) {
  return requestSession("/whatsapp-sessions/me", token);
}

export function activateWhatsappSession(token: string) {
  return requestSession("/whatsapp-sessions/activate", token, "POST");
}

export function pauseWhatsappSession(token: string) {
  return requestSession("/whatsapp-sessions/pause", token, "POST");
}

export function logoutWhatsappSession(token: string) {
  return requestSession("/whatsapp-sessions/logout", token, "POST");
}
