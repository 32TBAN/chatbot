import { Controller, Get, Injectable, Module, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  AuthenticatedUser,
  requireBusinessId,
} from '../../auth/types/authenticated-user.type';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
class MessageInboxService {
  constructor(private readonly prisma: PrismaService) {}

  async listConversations(user: AuthenticatedUser) {
    const businessId = requireBusinessId(user);
    const messages = await this.prisma.message.findMany({
      where: {
        businessId,
        customerId: {
          not: null,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            source: true,
          },
        },
      },
      orderBy: [
        { sentAt: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    const conversations = new Map<string, (typeof messages)[number][]>();
    for (const message of messages) {
      if (!message.customer) {
        continue;
      }

      const bucket = conversations.get(message.customer.id) ?? [];
      bucket.push(message);
      conversations.set(message.customer.id, bucket);
    }

    return Array.from(conversations.entries())
      .map(([customerId, items]) => {
        const latest = items[0];
        const customer = latest.customer;
        const source = customer?.source ?? 'whatsapp';
        return {
          customerId,
          customerName: customer?.name?.trim() || null,
          phone: customer?.phone ?? 'Sin telefono',
          source,
          isDebug: source === 'debug',
          lastDirection: latest.direction,
          lastMessage: latest.content?.trim() || '[Mensaje sin texto]',
          lastMessageAt: (latest.sentAt ?? latest.createdAt).toISOString(),
          messageCount: items.length,
        };
      })
      .sort((left, right) => right.lastMessageAt.localeCompare(left.lastMessageAt));
  }

  async getConversation(user: AuthenticatedUser, customerId: string) {
    const businessId = requireBusinessId(user);
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, businessId },
      select: {
        id: true,
        name: true,
        phone: true,
        source: true,
      },
    });

    if (!customer) {
      return {
        customer: null,
        messages: [],
      };
    }

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
      customer: {
        id: customer.id,
        name: customer.name?.trim() || null,
        phone: customer.phone,
        source: customer.source ?? 'whatsapp',
        isDebug: customer.source === 'debug',
      },
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

@Controller('message-inbox')
@UseGuards(JwtAuthGuard)
class MessageInboxController {
  constructor(private readonly messageInboxService: MessageInboxService) {}

  @Get('conversations')
  findConversations(@CurrentUser() user: AuthenticatedUser) {
    return this.messageInboxService.listConversations(user);
  }

  @Get('conversations/:customerId/messages')
  findConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('customerId') customerId: string,
  ) {
    return this.messageInboxService.getConversation(user, customerId);
  }
}

@Module({
  controllers: [MessageInboxController],
  providers: [MessageInboxService],
})
export class MessageInboxModule {}
