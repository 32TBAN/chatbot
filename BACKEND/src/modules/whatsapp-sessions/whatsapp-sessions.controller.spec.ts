import { WhatsappSessionsController } from './whatsapp-sessions.controller';

describe('WhatsappSessionsController', () => {
  const user = {
    userId: 'user-1',
    businessId: 'business-1',
    role: 'owner',
  };

  it('delegates findCurrent to the service', async () => {
    const service = {
      getView: jest.fn().mockResolvedValue({ id: 'session-1' }),
    } as any;
    const controller = new WhatsappSessionsController(service);

    await controller.findCurrent(user as any);

    expect(service.getView).toHaveBeenCalledWith(user);
  });

  it('delegates activate, pause and logout to the service', async () => {
    const service = {
      activate: jest.fn().mockResolvedValue({}),
      pause: jest.fn().mockResolvedValue({}),
      logout: jest.fn().mockResolvedValue({}),
    } as any;
    const controller = new WhatsappSessionsController(service);

    await controller.activate(user as any);
    await controller.pause(user as any);
    await controller.logout(user as any);

    expect(service.activate).toHaveBeenCalledWith(user);
    expect(service.pause).toHaveBeenCalledWith(user);
    expect(service.logout).toHaveBeenCalledWith(user);
  });
});
