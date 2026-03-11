import { WhatsappSessionStatus } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';
import { WhatsappSessionsService } from './whatsapp-sessions.service';

const user = {
  userId: 'user-1',
  businessId: 'business-1',
  role: 'owner',
};

function createSession(overrides = {}) {
  const now = new Date('2026-03-11T15:00:00.000Z');
  return {
    id: 'session-1',
    businessId: 'business-1',
    sessionKey: 'business-business-1',
    phoneNumber: null,
    qrCode: null,
    status: WhatsappSessionStatus.disconnected,
    connectedAt: null,
    lastSeenAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('WhatsappSessionsService', () => {
  it('returns an empty view when no session exists', async () => {
    const prisma = {
      whatsappSession: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    } as any;
    const runtime = {
      hasStoredCredentials: jest.fn().mockResolvedValue(false),
      isRuntimeActive: jest.fn().mockReturnValue(false),
    } as any;

    const service = new WhatsappSessionsService(prisma, runtime);
    const view = await service.getView(user);

    expect(view.status).toBeNull();
    expect(view.id).toBeNull();
    expect(view.hasStoredCredentials).toBe(false);
    expect(view.isRuntimeActive).toBe(false);
  });

  it('creates and activates a session when missing', async () => {
    const created = createSession();
    const refreshed = createSession({ status: WhatsappSessionStatus.pending });
    const prisma = {
      whatsappSession: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(refreshed),
        create: jest.fn().mockResolvedValue(created),
      },
    } as any;
    const runtime = {
      activate: jest.fn().mockResolvedValue(undefined),
      hasStoredCredentials: jest.fn().mockResolvedValue(false),
      isRuntimeActive: jest.fn().mockReturnValue(true),
    } as any;

    const service = new WhatsappSessionsService(prisma, runtime);
    const view = await service.activate(user);

    expect(prisma.whatsappSession.create).toHaveBeenCalledWith({
      data: {
        businessId: 'business-1',
        sessionKey: 'business-business-1',
        status: WhatsappSessionStatus.disconnected,
      },
    });
    expect(runtime.activate).toHaveBeenCalledWith(created);
    expect(view.status).toBe(WhatsappSessionStatus.pending);
    expect(view.isRuntimeActive).toBe(true);
  });

  it('pauses an existing session', async () => {
    const existing = createSession({ status: WhatsappSessionStatus.connected });
    const paused = createSession({ status: WhatsappSessionStatus.paused });
    const prisma = {
      whatsappSession: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce(existing)
          .mockResolvedValueOnce(paused),
      },
    } as any;
    const runtime = {
      pause: jest.fn().mockResolvedValue(undefined),
      hasStoredCredentials: jest.fn().mockResolvedValue(true),
      isRuntimeActive: jest.fn().mockReturnValue(false),
    } as any;

    const service = new WhatsappSessionsService(prisma, runtime);
    const view = await service.pause(user);

    expect(runtime.pause).toHaveBeenCalledWith(existing);
    expect(view.status).toBe(WhatsappSessionStatus.paused);
    expect(view.hasStoredCredentials).toBe(true);
  });

  it('fails when business setup is missing', async () => {
    const prisma = { whatsappSession: { findUnique: jest.fn() } } as any;
    const runtime = {
      hasStoredCredentials: jest.fn(),
      isRuntimeActive: jest.fn(),
    } as any;

    const service = new WhatsappSessionsService(prisma, runtime);

    await expect(
      service.getView({ userId: 'user-1', businessId: null, role: 'owner' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
