import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  FlowNodeType,
  MessageDirection,
  MessageType,
  Prisma,
  WhatsappSession,
  WhatsappSessionStatus,
} from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ClientFactory,
  LocalAuthFactory,
  RuntimeHandle,
  WhatsappClient,
  WhatsappMessage,
} from './whatsapp-sessions.types';

const whatsappWebModule = require('whatsapp-web.js') as {
  Client: ClientFactory;
  LocalAuth: LocalAuthFactory;
};
const qrCodeModule = require('qrcode') as {
  toDataURL: (value: string) => Promise<string>;
};

const MAIN_FLOW_NAME = 'main_whatsapp_automation';
const KEYWORD_ROUTER_TITLE = '__keyword_router__';

type FlowGraph = Prisma.FlowGetPayload<{
  include: {
    flowNodes: {
      include: {
        options: {
          include: {
            nextNode: true;
          };
          orderBy: {
            sortOrder: 'asc';
          };
        };
      };
      orderBy: {
        sortOrder: 'asc';
      };
    };
  };
}>;

@Injectable()
export class WhatsappRuntimeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsappRuntimeService.name);
  private readonly handles = new Map<string, RuntimeHandle>();
  private readonly activationLocks = new Map<string, Promise<void>>();
  private readonly sessionsRoot = path.join(process.cwd(), '.wa-sessions');

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await fs.mkdir(this.sessionsRoot, { recursive: true });

    const sessions = await this.prisma.whatsappSession.findMany();
    for (const session of sessions) {
      const hasStoredCredentials = await this.hasStoredCredentials(session.sessionKey);
      if (!hasStoredCredentials) {
        continue;
      }

      void this.activate(session, true).catch((error: unknown) => {
        this.logger.error(
          `Failed to restore WhatsApp session for business ${session.businessId}`,
          error instanceof Error ? error.stack : undefined,
        );
      });
    }
  }

  async onModuleDestroy() {
    const handles = Array.from(this.handles.values());
    await Promise.all(handles.map((handle) => this.safeDestroy(handle.client)));
    this.handles.clear();
  }

  isRuntimeActive(businessId: string) {
    return this.handles.has(businessId);
  }

  async hasStoredCredentials(sessionKey: string) {
    const sessionPath = this.getSessionDirectory(sessionKey);

    try {
      const stats = await fs.stat(sessionPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  async activate(session: WhatsappSession, restoring = false) {
    const activeHandle = this.handles.get(session.businessId);
    if (activeHandle) {
      return;
    }

    const lock = this.activationLocks.get(session.businessId);
    if (lock) {
      await lock;
      return;
    }

    const activation = this.startClient(session, restoring);
    this.activationLocks.set(session.businessId, activation);

    try {
      await activation;
    } finally {
      this.activationLocks.delete(session.businessId);
    }
  }

  async pause(session: WhatsappSession) {
    const handle = this.handles.get(session.businessId);
    if (handle) {
      this.handles.delete(session.businessId);
      await this.safeDestroy(handle.client);
    }

    await this.prisma.whatsappSession.update({
      where: { id: session.id },
      data: {
        qrCode: null,
        status: WhatsappSessionStatus.paused,
        lastSeenAt: new Date(),
      },
    });
  }

  async logout(session: WhatsappSession) {
    const handle = this.handles.get(session.businessId);
    if (handle) {
      this.handles.delete(session.businessId);

      if (handle.client.logout) {
        try {
          await handle.client.logout();
        } catch (error) {
          this.logger.warn(
            `Logout failed for business ${session.businessId}: ${error instanceof Error ? error.message : 'unknown error'}`,
          );
        }
      }

      await this.safeDestroy(handle.client);
    }

    await this.removeStoredCredentials(session.sessionKey);

    await this.prisma.whatsappSession.update({
      where: { id: session.id },
      data: {
        phoneNumber: null,
        qrCode: null,
        status: WhatsappSessionStatus.disconnected,
        lastSeenAt: new Date(),
      },
    });
  }

  private async startClient(session: WhatsappSession, restoring: boolean) {
    const token = Symbol(session.businessId);
    const client = new whatsappWebModule.Client({
      authStrategy: new whatsappWebModule.LocalAuth({
        clientId: session.sessionKey,
        dataPath: this.sessionsRoot,
      }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
      restartOnAuthFail: true,
    });

    this.handles.set(session.businessId, { client, token });
    this.bindClientEvents(session, client, token);

    await this.prisma.whatsappSession.update({
      where: { id: session.id },
      data: {
        qrCode: null,
        status: restoring ? session.status : WhatsappSessionStatus.pending,
        lastSeenAt: new Date(),
      },
    });

    try {
      await client.initialize();
    } catch (error) {
      this.handles.delete(session.businessId);
      await this.prisma.whatsappSession.update({
        where: { id: session.id },
        data: {
          qrCode: null,
          status: WhatsappSessionStatus.disconnected,
          lastSeenAt: new Date(),
        },
      });
      throw error;
    }
  }

  private bindClientEvents(session: WhatsappSession, client: WhatsappClient, token: symbol) {
    client.on('qr', (qr: string) => {
      void this.handleQr(session, qr, token);
    });

    client.on('ready', () => {
      void this.handleReady(session, client, token);
    });

    client.on('authenticated', () => {
      void this.markAlive(session, token);
    });

    client.on('auth_failure', () => {
      void this.handleDisconnected(session, WhatsappSessionStatus.expired, token);
    });

    client.on('disconnected', () => {
      void this.handleDisconnected(session, WhatsappSessionStatus.disconnected, token);
    });

    client.on('message', (message: WhatsappMessage) => {
      void this.handleIncomingMessage(session, client, message, token);
    });
  }

  private async handleQr(session: WhatsappSession, qr: string, token: symbol) {
    if (!this.isCurrentHandle(session.businessId, token)) {
      return;
    }

    const dataUrl = await qrCodeModule.toDataURL(qr);
    await this.prisma.whatsappSession.update({
      where: { id: session.id },
      data: {
        qrCode: dataUrl,
        status: WhatsappSessionStatus.pending,
        lastSeenAt: new Date(),
      },
    });
  }

  private async handleReady(session: WhatsappSession, client: WhatsappClient, token: symbol) {
    if (!this.isCurrentHandle(session.businessId, token)) {
      return;
    }

    const rawPhone = client.info?.wid?.user ?? null;
    const phoneNumber = rawPhone ? `+${rawPhone}` : null;
    const now = new Date();

    await this.prisma.whatsappSession.update({
      where: { id: session.id },
      data: {
        phoneNumber,
        qrCode: null,
        status: WhatsappSessionStatus.connected,
        connectedAt: now,
        lastSeenAt: now,
      },
    });
  }

  private async markAlive(session: WhatsappSession, token: symbol) {
    if (!this.isCurrentHandle(session.businessId, token)) {
      return;
    }

    await this.prisma.whatsappSession.update({
      where: { id: session.id },
      data: {
        lastSeenAt: new Date(),
      },
    });
  }

  private async handleIncomingMessage(
    session: WhatsappSession,
    client: WhatsappClient,
    message: WhatsappMessage,
    token: symbol,
  ) {
    if (!this.isCurrentHandle(session.businessId, token) || message.fromMe) {
      return;
    }

    const chatId = message.from ?? null;
    const phone = this.normalizePhone(chatId);
    if (!chatId || !phone) {
      return;
    }

    const externalMessageId = message.id?._serialized ?? null;
    if (externalMessageId) {
      const existingMessage = await this.prisma.message.findFirst({
        where: {
          businessId: session.businessId,
          externalMessageId,
        },
        select: { id: true },
      });

      if (existingMessage) {
        return;
      }
    }

    const customer = await this.ensureCustomer(session.businessId, phone);
    const sentAt = this.resolveSentAt(message.timestamp);
    const inboundContent = message.body?.trim() || null;

    await this.prisma.message.create({
      data: {
        businessId: session.businessId,
        customerId: customer.id,
        whatsappSessionId: session.id,
        direction: MessageDirection.inbound,
        messageType: this.mapMessageType(message.type, message.hasMedia),
        content: inboundContent,
        externalMessageId,
        sentAt,
      },
    });

    await this.markAlive(session, token);

    const replies = await this.resolveBotReplies(session.businessId, inboundContent);
    if (!replies.length || !client.sendMessage) {
      return;
    }

    for (const reply of replies) {
      const content = reply.trim();
      if (!content) {
        continue;
      }

      try {
        await client.sendMessage(chatId, content);
      } catch (error) {
        this.logger.warn(
          `Failed to send automated reply for business ${session.businessId}: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
        continue;
      }

      await this.prisma.message.create({
        data: {
          businessId: session.businessId,
          customerId: customer.id,
          whatsappSessionId: session.id,
          direction: MessageDirection.outbound,
          messageType: MessageType.text,
          content,
          sentAt: new Date(),
        },
      });
    }
  }

  private async resolveBotReplies(businessId: string, inboundContent: string | null) {
    const normalized = inboundContent?.trim().toLowerCase() ?? '';
    if (!normalized) {
      return [] as string[];
    }

    const flow = await this.findMainFlow(businessId);
    if (!flow?.isActive) {
      return [] as string[];
    }

    const welcomeNode = flow.flowNodes.find((item) => item.nodeType === FlowNodeType.welcome && item.isActive) ?? null;
    const menuNode = flow.flowNodes.find((item) => item.nodeType === FlowNodeType.menu && item.isActive) ?? null;
    const fallbackNode = flow.flowNodes.find((item) => item.nodeType === FlowNodeType.fallback && item.isActive) ?? null;
    const keywordRouter = flow.flowNodes.find((item) => item.title === KEYWORD_ROUTER_TITLE && item.isActive) ?? null;

    if (normalized === 'hola' || normalized === 'menu') {
      const responses: string[] = [];
      if (welcomeNode?.content?.trim()) {
        responses.push(welcomeNode.content.trim());
      }
      if (menuNode) {
        responses.push(this.formatMenuMessage(menuNode));
      }
      return responses;
    }

    const selectedOption = this.findMenuOption(menuNode, normalized);
    if (selectedOption?.nextNode?.isActive && selectedOption.nextNode.content?.trim()) {
      return [selectedOption.nextNode.content.trim()];
    }

    const keywordOption = keywordRouter?.options.find(
      (item) => item.optionValue.trim().toLowerCase() === normalized && item.nextNode?.isActive,
    );
    if (keywordOption?.nextNode?.content?.trim()) {
      return [keywordOption.nextNode.content.trim()];
    }

    if (fallbackNode?.content?.trim()) {
      return [fallbackNode.content.trim()];
    }

    if (menuNode) {
      return [`No entendi tu mensaje.\n\n${this.formatMenuMessage(menuNode)}`];
    }

    return [] as string[];
  }

  private async findMainFlow(businessId: string) {
    return this.prisma.flow.findFirst({
      where: { businessId, name: MAIN_FLOW_NAME },
      include: {
        flowNodes: {
          include: {
            options: {
              include: {
                nextNode: true,
              },
              orderBy: {
                sortOrder: 'asc',
              },
            },
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    }) as Promise<FlowGraph | null>;
  }

  private findMenuOption(flowNode: FlowGraph['flowNodes'][number] | null, normalizedInput: string) {
    if (!flowNode) {
      return null;
    }

    const numericChoice = Number.parseInt(normalizedInput, 10);
    if (!Number.isNaN(numericChoice)) {
      return flowNode.options[numericChoice - 1] ?? null;
    }

    return (
      flowNode.options.find(
        (option) => option.optionLabel.trim().toLowerCase() === normalizedInput || option.optionValue.trim().toLowerCase() === normalizedInput,
      ) ?? null
    );
  }

  private formatMenuMessage(menuNode: FlowGraph['flowNodes'][number]) {
    const lines = menuNode.options.map((option, index) => `${index + 1}. ${option.optionLabel}`);
    const intro = menuNode.content?.trim() || 'Elige una opcion para continuar.';
    return lines.length ? `${intro}\n\n${lines.join('\n')}` : intro;
  }

  private async ensureCustomer(businessId: string, phone: string) {
    const existingCustomer = await this.prisma.customer.findFirst({
      where: {
        businessId,
        phone,
      },
      select: {
        id: true,
        name: true,
        phone: true,
      },
    });

    if (existingCustomer) {
      return existingCustomer;
    }

    return this.prisma.customer.create({
      data: {
        businessId,
        phone,
        name: phone,
        source: 'whatsapp',
      },
      select: {
        id: true,
        name: true,
        phone: true,
      },
    });
  }

  private mapMessageType(rawType?: string, hasMedia?: boolean) {
    if (rawType === 'image') return MessageType.image;
    if (rawType === 'document') return MessageType.document;
    if (rawType === 'audio' || rawType === 'ptt') return MessageType.audio;
    if (rawType === 'video') return MessageType.video;
    if (rawType === 'location') return MessageType.location;
    if (rawType === 'chat' || rawType === 'text') return MessageType.text;
    if (hasMedia) return MessageType.document;
    return MessageType.text;
  }

  private normalizePhone(chatId: string | null) {
    if (!chatId) {
      return null;
    }

    const numeric = chatId.split('@')[0]?.replace(/\D+/g, '') ?? '';
    return numeric ? `+${numeric}` : null;
  }

  private resolveSentAt(timestamp?: number) {
    if (!timestamp) {
      return new Date();
    }

    return new Date(timestamp * 1000);
  }

  private async handleDisconnected(
    session: WhatsappSession,
    status: WhatsappSessionStatus,
    token: symbol,
  ) {
    if (!this.isCurrentHandle(session.businessId, token)) {
      return;
    }

    this.handles.delete(session.businessId);
    await this.prisma.whatsappSession.update({
      where: { id: session.id },
      data: {
        qrCode: null,
        status,
        lastSeenAt: new Date(),
      },
    });
  }

  private isCurrentHandle(businessId: string, token: symbol) {
    return this.handles.get(businessId)?.token === token;
  }

  private getSessionDirectory(sessionKey: string) {
    return path.join(this.sessionsRoot, `session-${sessionKey}`);
  }

  private async removeStoredCredentials(sessionKey: string) {
    const sessionPath = this.getSessionDirectory(sessionKey);
    await fs.rm(sessionPath, { force: true, recursive: true });
  }

  private async safeDestroy(client: WhatsappClient) {
    try {
      await client.destroy();
    } catch (error) {
      this.logger.warn(
        `Failed to destroy WhatsApp client: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }
}
