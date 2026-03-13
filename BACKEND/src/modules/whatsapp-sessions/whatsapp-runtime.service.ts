import { BadRequestException, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  MessageType,
  WhatsappSession,
  WhatsappSessionStatus,
} from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { toAbsoluteMediaPath } from '../../common/media-storage';
import {
  ClientFactory,
  LocalAuthFactory,
  OutboundAction,
  RuntimeHandle,
  WhatsappClient,
  WhatsappMessage,
} from './whatsapp-sessions.types';
import { WhatsappAutomationService } from './whatsapp-automation.service';

const whatsappWebModule = require('whatsapp-web.js') as {
  Client: ClientFactory;
  LocalAuth: LocalAuthFactory;
  MessageMedia: {
    fromFilePath: (filePath: string) => unknown;
  };
  Location: new (latitude: number, longitude: number, options?: Record<string, unknown>) => unknown;
};
const qrCodeModule = require('qrcode') as {
  toDataURL: (value: string) => Promise<string>;
};

const DEBUG_CHAT_SUFFIX = '@debug.local';

@Injectable()
export class WhatsappRuntimeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsappRuntimeService.name);
  private readonly handles = new Map<string, RuntimeHandle>();
  private readonly activationLocks = new Map<string, Promise<void>>();
  private readonly sessionsRoot = path.join(process.cwd(), '.wa-sessions');

  constructor(
    private readonly prisma: PrismaService,
    private readonly automation: WhatsappAutomationService,
  ) {}

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

  async simulateInboundDebug(session: WhatsappSession, content: string) {
    if (session.status !== WhatsappSessionStatus.connected || !this.isRuntimeActive(session.businessId)) {
      throw new BadRequestException('La sesion de WhatsApp debe estar conectada para ejecutar pruebas.');
    }

    const phone = this.resolveDebugPhone(session.phoneNumber);
    return this.automation.processInboundMessage({
      businessId: session.businessId,
      sessionId: session.id,
      phone,
      inboundContent: content.trim(),
      messageType: MessageType.text,
      customerName: 'Prueba Debug WhatsApp',
      customerSource: 'debug',
      sentAt: new Date(),
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
    const phone = this.automation.normalizePhone(chatId);
    if (!chatId || !phone) {
      return;
    }

    const externalMessageId = message.id?._serialized ?? null;
    if (externalMessageId) {
      const existingMessage = await this.automation.findMessageByExternalId(session.businessId, externalMessageId);
      if (existingMessage) {
        return;
      }
    }

    const allowAutomatedReply = await this.shouldSendAutomatedReply(session.businessId, phone);

    await this.automation.processInboundMessage({
      businessId: session.businessId,
      sessionId: session.id,
      phone,
      inboundContent: message.body?.trim() || null,
      messageType: this.mapMessageType(message.type, message.hasMedia),
      externalMessageId,
      sentAt: this.automation.resolveSentAt(message.timestamp),
      dispatchReply: async (action) => {
        if (!allowAutomatedReply || !client.sendMessage) {
          return false;
        }

        try {
          await this.sendOutboundAction(client, chatId, action);
          return true;
        } catch (error) {
          this.logger.warn(
            `Failed to send automated reply for business ${session.businessId}: ${error instanceof Error ? error.message : 'unknown error'}`,
          );
          return false;
        }
      },
    });

    await this.markAlive(session, token);
  }

  private async sendOutboundAction(client: WhatsappClient, chatId: string, action: OutboundAction) {
    if (!client.sendMessage) {
      return;
    }

    if (action.type === 'text') {
      await client.sendMessage(chatId, action.content);
      return;
    }

    if (action.type === 'media') {
      const absolutePath = toAbsoluteMediaPath(action.mediaPath);
      if (!absolutePath) {
        return;
      }

      const media = whatsappWebModule.MessageMedia.fromFilePath(absolutePath);
      await client.sendMessage(chatId, media, {
        caption: action.caption ?? undefined,
        ...(action.mediaKind === 'video' ? { sendVideoAsGif: false } : {}),
      });
      return;
    }

    if (action.intro?.trim()) {
      await client.sendMessage(chatId, action.intro.trim());
    }

    const location = new whatsappWebModule.Location(action.latitude, action.longitude, {
      name: action.label ?? undefined,
      address: action.address ?? undefined,
      url: action.url ?? undefined,
    });
    await client.sendMessage(chatId, location);
  }

  private async shouldSendAutomatedReply(businessId: string, phone: string) {
    const settings = await this.prisma.businessSettings.findUnique({
      where: { businessId },
      select: {
        targetingMode: true,
        targetingNumbers: true,
      },
    });

    if (!settings || settings.targetingMode === 'all') {
      return true;
    }

    const numbers = new Set((settings.targetingNumbers ?? []).map((value) => value.trim()).filter(Boolean));
    if (settings.targetingMode === 'exclude') {
      return !numbers.has(phone);
    }

    if (settings.targetingMode === 'allow_only') {
      return numbers.has(phone);
    }

    return true;
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

  private resolveDebugPhone(phoneNumber: string | null) {
    const sanitized = phoneNumber?.replace(/\D+/g, '') || '593000000000';
    const suffix = sanitized.slice(-8).padStart(8, '0');
    return `+999${suffix}`;
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
