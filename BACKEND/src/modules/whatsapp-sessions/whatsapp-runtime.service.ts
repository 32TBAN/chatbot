import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { WhatsappSession, WhatsappSessionStatus } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ClientFactory,
  LocalAuthFactory,
  RuntimeHandle,
  WhatsappClient,
} from './whatsapp-sessions.types';

const whatsappWebModule = require('whatsapp-web.js') as {
  Client: ClientFactory;
  LocalAuth: LocalAuthFactory;
};
const qrCodeModule = require('qrcode') as {
  toDataURL: (value: string) => Promise<string>;
};

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
