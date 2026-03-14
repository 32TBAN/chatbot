import { apiRequest } from "@/lib/api";

export type AutomationKey = "welcome" | "menu" | "appointments" | "products" | "location" | "support";

export type QuickAutomationView = {
  key: AutomationKey;
  title: string;
  description: string;
  enabled: boolean;
  nodeId: string | null;
  message: string;
  triggers: string[];
};

export type MenuOptionView = {
  id: string;
  label: string;
  targetKey: AutomationKey;
  position: number;
};

export type KeywordView = {
  id: string;
  keyword: string;
  label: string;
  response: string;
};

export type NodeRegistryItem = {
  key: AutomationKey;
  label: string;
  enabled: boolean;
  nodeId: string | null;
};

export type AutomationMainFlowView = {
  flowId: string | null;
  flowName: string;
  isActive: boolean;
  quickAutomations: QuickAutomationView[];
  menu: {
    message: string;
    options: MenuOptionView[];
  };
  keywords: KeywordView[];
  nodeRegistry: NodeRegistryItem[];
};

type AutomationMainFlowResult =
  | { ok: true; flow: AutomationMainFlowView }
  | {
      ok: false;
      code: "config_error" | "network_error" | "server_error";
      message: string;
    };

async function requestAutomationMainFlow(
  token: string,
  init?: RequestInit,
): Promise<AutomationMainFlowResult> {
  try {
    const response = await apiRequest("/automation-main-flow", {
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
        message: init?.method === "PUT"
          ? "No se pudo guardar la configuracion del bot."
          : "No se pudo cargar la configuracion del bot.",
      };
    }

    const flow = (await response.json()) as AutomationMainFlowView;
    return { ok: true, flow };
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
      message: init?.method === "PUT"
        ? "No se pudo guardar la configuracion del bot."
        : "No se pudo cargar la configuracion del bot.",
    };
  }
}

export function getAutomationMainFlow(token: string) {
  return requestAutomationMainFlow(token);
}

export function updateAutomationMainFlow(token: string, flow: AutomationMainFlowView) {
  return requestAutomationMainFlow(token, {
    method: "PUT",
    body: JSON.stringify({
      isActive: flow.isActive,
      quickAutomations: flow.quickAutomations.map((item) => ({
        key: item.key,
        enabled: item.enabled,
        message: item.message,
        triggers: item.triggers,
      })),
      menu: {
        message: flow.menu.message,
        options: flow.menu.options.map((item) => ({
          id: item.id,
          label: item.label,
          targetKey: item.targetKey,
        })),
      },
      keywords: flow.keywords.map((item) => ({
        id: item.id,
        keyword: item.keyword,
        label: item.label,
        response: item.response,
      })),
    }),
  });
}