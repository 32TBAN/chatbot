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

export type PreviewConversationResult = {
  customer: {
    id: string;
    name: string | null;
    phone: string;
    source: string;
    isPreview: boolean;
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

type PreviewInboundResult =
  | {
      ok: true;
      conversation: PreviewConversationResult;
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
      message: "No se pudo actualizar la sesion de WhatsApp.",
    };
  }
}

export async function simulateWhatsappPreviewInbound(
  token: string,
  input: { content: string; messageType?: "text" | "image" | "video" | "document" },
): Promise<PreviewInboundResult> {
  try {
    const response = await apiRequest("/whatsapp-sessions/preview/inbound", {
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
        message: "No se pudo ejecutar la prueba del bot.",
      };
    }

    return {
      ok: true,
      conversation: (await response.json()) as PreviewConversationResult,
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
      message: "No se pudo ejecutar la prueba del bot.",
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

