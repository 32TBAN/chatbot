import { WhatsappSession, WhatsappSessionStatus } from '@prisma/client';

export type RuntimeHandle = {
  client: WhatsappClient;
  token: symbol;
};

export type WhatsappMessage = {
  body?: string;
  from?: string;
  fromMe?: boolean;
  hasMedia?: boolean;
  id?: {
    _serialized?: string;
  };
  timestamp?: number;
  type?: string;
};

export type WhatsappClient = {
  destroy: () => Promise<void>;
  initialize: () => Promise<void>;
  logout?: () => Promise<void>;
  sendMessage?: (chatId: string, content: string) => Promise<unknown>;
  on: (event: string, listener: (...args: any[]) => void | Promise<void>) => void;
  info?: {
    wid?: {
      user?: string;
    };
    pushname?: string;
  };
};

export type LocalAuthFactory = new (options: { clientId: string; dataPath: string }) => unknown;
export type ClientFactory = new (options: Record<string, unknown>) => WhatsappClient;

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

export function toWhatsappSessionView(
  businessId: string,
  session: WhatsappSession | null,
  hasStoredCredentials: boolean,
  isRuntimeActive: boolean,
): WhatsappSessionView {
  if (!session) {
    return {
      id: null,
      sessionKey: null,
      phoneNumber: null,
      qrCode: null,
      status: null,
      connectedAt: null,
      lastSeenAt: null,
      createdAt: null,
      updatedAt: null,
      hasStoredCredentials,
      isRuntimeActive,
    };
  }

  return {
    id: session.id,
    sessionKey: session.sessionKey,
    phoneNumber: session.phoneNumber,
    qrCode: session.qrCode,
    status: session.status,
    connectedAt: session.connectedAt?.toISOString() ?? null,
    lastSeenAt: session.lastSeenAt?.toISOString() ?? null,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    hasStoredCredentials,
    isRuntimeActive,
  };
}
