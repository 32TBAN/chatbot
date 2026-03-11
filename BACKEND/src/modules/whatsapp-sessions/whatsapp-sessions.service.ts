import { Injectable } from '@nestjs/common';
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
}
