export type InboxConversation = {
  customerId: string;
  customerName: string | null;
  phone: string;
  source: string;
  isDebug: boolean;
  lastDirection: 'inbound' | 'outbound';
  lastMessage: string;
  lastMessageAt: string;
  messageCount: number;
};

export type InboxMessage = {
  id: string;
  direction: 'inbound' | 'outbound';
  messageType: string;
  content: string;
  sentAt: string;
};

export type InboxConversationDetail = {
  customer: {
    id: string;
    name: string | null;
    phone: string;
    source: string;
    isDebug: boolean;
  } | null;
  messages: InboxMessage[];
};

import { apiRequest } from '@/lib/api';

type InboxResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

async function requestInbox<T>(path: string, token: string): Promise<InboxResult<T>> {
  try {
    const response = await apiRequest(path, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return {
        ok: false,
        message: 'No se pudo cargar el historial de WhatsApp.',
      };
    }

    return {
      ok: true,
      data: (await response.json()) as T,
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'api_url_missing') {
      return {
        ok: false,
        message: 'Falta configurar VITE_API_URL para conectar con el backend.',
      };
    }

    return {
      ok: false,
      message: 'No se pudo conectar con el backend para cargar el historial.',
    };
  }
}

export function getInboxConversations(token: string) {
  return requestInbox<InboxConversation[]>('/message-inbox/conversations', token);
}

export function getInboxConversation(token: string, customerId: string) {
  return requestInbox<InboxConversationDetail>(`/message-inbox/conversations/${customerId}/messages`, token);
}
