import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { WhatsappSessionStatus } from '@prisma/client';
import {
  AuthenticatedUser,
  requireBusinessId,
} from '../../auth/types/authenticated-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsappRuntimeService } from './whatsapp-runtime.service';
import { toWhatsappSessionView, WhatsappSessionView } from './whatsapp-sessions.types';

@Injectable()
export class WhatsappSessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly runtime: WhatsappRuntimeService,
  ) {}

  async getView(user: AuthenticatedUser): Promise<WhatsappSessionView> {
    const businessId = requireBusinessId(user);
    const session = await this.prisma.whatsappSession.findUnique({
      where: { businessId },
    });

    return this.buildView(businessId, session?.sessionKey ?? null, session);
  }

  async activate(user: AuthenticatedUser): Promise<WhatsappSessionView> {
    const businessId = requireBusinessId(user);
    const session = await this.ensureSessionRecord(businessId);

    await this.runtime.activate(session);

    const refreshed = await this.prisma.whatsappSession.findUnique({
      where: { businessId },
    });

    return this.buildView(businessId, session.sessionKey, refreshed);
  }

  async pause(user: AuthenticatedUser): Promise<WhatsappSessionView> {
    const businessId = requireBusinessId(user);
    const session = await this.ensureSessionRecord(businessId);

    await this.runtime.pause(session);

    const refreshed = await this.prisma.whatsappSession.findUnique({
      where: { businessId },
    });

    return this.buildView(businessId, session.sessionKey, refreshed);
  }

  async logout(user: AuthenticatedUser): Promise<WhatsappSessionView> {
    const businessId = requireBusinessId(user);
    const session = await this.ensureSessionRecord(businessId);

    await this.runtime.logout(session);

    const refreshed = await this.prisma.whatsappSession.findUnique({
      where: { businessId },
    });

    return this.buildView(businessId, session.sessionKey, refreshed);
  }

  async simulateInboundDebug(user: AuthenticatedUser, content: string) {
    if (user.role !== 'owner') {
      throw new ForbiddenException('Solo el owner puede usar el debug de WhatsApp');
    }

    const businessId = requireBusinessId(user);
    const session = await this.prisma.whatsappSession.findUnique({
      where: { businessId },
    });

    if (!session || session.status !== WhatsappSessionStatus.connected) {
      throw new BadRequestException('La sesion de WhatsApp no esta conectada.');
    }

    const simulation = await this.runtime.simulateInboundDebug(session, content);
    return this.getConversationPayload(businessId, simulation.customer.id);
  }

  private async ensureSessionRecord(businessId: string) {
    const existing = await this.prisma.whatsappSession.findUnique({
      where: { businessId },
    });
    if (existing) {
      return existing;
    }

    return this.prisma.whatsappSession.create({
      data: {
        businessId,
        sessionKey: `business-${businessId}`,
        status: WhatsappSessionStatus.disconnected,
      },
    });
  }

  private async buildView(
    businessId: string,
    sessionKey: string | null,
    session: Awaited<ReturnType<PrismaService['whatsappSession']['findUnique']>>,
  ): Promise<WhatsappSessionView> {
    const hasStoredCredentials = sessionKey
      ? await this.runtime.hasStoredCredentials(sessionKey)
      : false;

    return toWhatsappSessionView(
      businessId,
      session,
      hasStoredCredentials,
      this.runtime.isRuntimeActive(businessId),
    );
  }

  private async getConversationPayload(businessId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, businessId },
      select: {
        id: true,
        name: true,
        phone: true,
        source: true,
      },
    });

    const messages = await this.prisma.message.findMany({
      where: {
        businessId,
        customerId,
      },
      orderBy: [
        { sentAt: 'asc' },
        { createdAt: 'asc' },
      ],
      select: {
        id: true,
        direction: true,
        messageType: true,
        content: true,
        sentAt: true,
        createdAt: true,
      },
    });

    return {
      customer: customer
        ? {
            id: customer.id,
            name: customer.name?.trim() || null,
            phone: customer.phone,
            source: customer.source ?? 'whatsapp',
            isDebug: customer.source === 'debug',
          }
        : null,
      messages: messages.map((message) => ({
        id: message.id,
        direction: message.direction,
        messageType: message.messageType,
        content: message.content?.trim() || '[Mensaje sin texto]',
        sentAt: (message.sentAt ?? message.createdAt).toISOString(),
      })),
    };
  }
}
