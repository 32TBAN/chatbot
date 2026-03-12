import { Injectable } from '@nestjs/common';
import {
  FlowNodeType,
  MessageDirection,
  MessageType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const MAIN_FLOW_NAME = 'main_whatsapp_automation';
const KEYWORD_ROUTER_TITLE = '__keyword_router__';
const MENU_TRIGGER_NODE_TITLE = '__menu_triggers__';

type IntentKey = 'appointments' | 'products' | 'support';

const INTENT_NODE_TYPES: Record<IntentKey, FlowNodeType> = {
  appointments: FlowNodeType.appointments,
  products: FlowNodeType.products,
  support: FlowNodeType.support,
};

const INTENT_KEYWORDS: Record<IntentKey, string[]> = {
  appointments: ['cita', 'reservar', 'reserva', 'agendar', 'turno'],
  products: ['producto', 'productos', 'catalogo', 'precio', 'precios'],
  support: ['soporte', 'ayuda', 'agente', 'humano', 'asesor'],
};

const INTENT_PRIORITY: IntentKey[] = ['appointments', 'products', 'support'];

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

type ProcessInboundInput = {
  businessId: string;
  sessionId: string | null;
  phone: string;
  inboundContent: string | null;
  messageType?: MessageType;
  externalMessageId?: string | null;
  sentAt?: Date;
  customerName?: string | null;
  customerSource?: string;
  dispatchReply?: (content: string) => Promise<boolean | void>;
};

@Injectable()
export class WhatsappAutomationService {
  constructor(private readonly prisma: PrismaService) {}

  async processInboundMessage(input: ProcessInboundInput) {
    const customer = await this.ensureCustomer(
      input.businessId,
      input.phone,
      input.customerSource ?? 'whatsapp',
      input.customerName,
    );

    await this.prisma.message.create({
      data: {
        businessId: input.businessId,
        customerId: customer.id,
        whatsappSessionId: input.sessionId,
        direction: MessageDirection.inbound,
        messageType: input.messageType ?? MessageType.text,
        content: input.inboundContent,
        externalMessageId: input.externalMessageId ?? undefined,
        sentAt: input.sentAt ?? new Date(),
      },
    });

    const replies = await this.resolveBotReplies(input.businessId, input.inboundContent);
    const savedReplies: string[] = [];

    for (const reply of replies) {
      const content = reply.trim();
      if (!content) {
        continue;
      }

      if (input.dispatchReply) {
        const delivered = await input.dispatchReply(content);
        if (delivered === false) {
          continue;
        }
      }

      await this.prisma.message.create({
        data: {
          businessId: input.businessId,
          customerId: customer.id,
          whatsappSessionId: input.sessionId,
          direction: MessageDirection.outbound,
          messageType: MessageType.text,
          content,
          sentAt: new Date(),
        },
      });

      savedReplies.push(content);
    }

    return {
      customer,
      replies: savedReplies,
    };
  }

  async resolveBotReplies(businessId: string, inboundContent: string | null) {
    const normalized = this.normalizeText(inboundContent);
    if (!normalized) {
      return [] as string[];
    }

    const flow = await this.findMainFlow(businessId);
    if (!flow?.isActive) {
      return [] as string[];
    }

    const welcomeNode = flow.flowNodes.find((item) => item.nodeType === FlowNodeType.welcome && item.isActive) ?? null;
    const menuNode = flow.flowNodes.find((item) => item.nodeType === FlowNodeType.menu && item.isActive) ?? null;
    const menuTriggerNode =
      flow.flowNodes.find((item) => item.nodeType === FlowNodeType.text_response && item.title === MENU_TRIGGER_NODE_TITLE && item.isActive) ?? null;
    const fallbackNode = flow.flowNodes.find((item) => item.nodeType === FlowNodeType.fallback && item.isActive && item.title !== KEYWORD_ROUTER_TITLE) ?? null;

    const responses: string[] = [];
    const hasGreeting = this.matchesNodeTriggers(welcomeNode, normalized);
    const intent = this.detectIntent(normalized);
    const shouldShowMenu =
      Boolean(menuNode) &&
      (normalized === 'menu' || this.matchesNodeTriggers(menuTriggerNode, normalized));

    if (hasGreeting && welcomeNode?.content?.trim()) {
      responses.push(welcomeNode.content.trim());
    }

    if (intent) {
      const intentNode = flow.flowNodes.find(
        (item) => item.nodeType === INTENT_NODE_TYPES[intent] && item.isActive,
      ) ?? null;

      if (intentNode?.content?.trim()) {
        responses.push(intentNode.content.trim());
      }
    }

    if (shouldShowMenu && menuNode && !intent) {
      responses.push(this.formatMenuMessage(menuNode));
    }

    const uniqueResponses = this.uniqueMessages(responses);
    if (uniqueResponses.length > 0) {
      return uniqueResponses;
    }

    if (!hasGreeting && menuNode) {
      return [this.formatMenuMessage(menuNode)];
    }

    if (fallbackNode?.content?.trim()) {
      return [fallbackNode.content.trim()];
    }

    return [] as string[];
  }

  async findMessageByExternalId(businessId: string, externalMessageId: string) {
    return this.prisma.message.findFirst({
      where: {
        businessId,
        externalMessageId,
      },
      select: { id: true },
    });
  }

  normalizePhone(chatId: string | null) {
    if (!chatId) {
      return null;
    }

    const numeric = chatId.split('@')[0]?.replace(/\D+/g, '') ?? '';
    return numeric ? `+${numeric}` : null;
  }

  resolveSentAt(timestamp?: number) {
    if (!timestamp) {
      return new Date();
    }

    return new Date(timestamp * 1000);
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

  private detectIntent(message: string): IntentKey | null {
    const normalizedMessage = this.normalizeText(message);
    if (!normalizedMessage) {
      return null;
    }

    if (normalizedMessage === '1') {
      return 'appointments';
    }

    if (normalizedMessage === '2') {
      return 'products';
    }

    if (normalizedMessage === '3') {
      return 'support';
    }

    for (const intent of INTENT_PRIORITY) {
      if (INTENT_KEYWORDS[intent].some((keyword) => normalizedMessage.includes(keyword))) {
        return intent;
      }
    }

    return null;
  }

  private formatMenuMessage(menuNode: FlowGraph['flowNodes'][number]) {
    const lines = menuNode.options.map((option, index) => `${index + 1}. ${option.optionLabel}`);
    const intro = menuNode.content?.trim() || '✨ Elige una opcion para continuar.';
    return lines.length ? `${intro}\n\n${lines.join('\n')}` : intro;
  }

  private matchesNodeTriggers(flowNode: FlowGraph['flowNodes'][number] | null, normalizedInput: string) {
    if (!flowNode?.isActive) {
      return false;
    }

    return flowNode.options.some((option) => this.containsMatch(normalizedInput, option.optionValue));
  }

  private containsMatch(normalizedInput: string, candidate: string | null | undefined) {
    const normalizedCandidate = this.normalizeText(candidate);
    return Boolean(normalizedCandidate) && normalizedInput.includes(normalizedCandidate);
  }

  private normalizeText(value: string | null | undefined) {
    return (value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private uniqueMessages(messages: string[]) {
    const seen = new Set<string>();
    return messages.filter((message) => {
      const normalized = message.trim();
      if (!normalized || seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    });
  }

  private async ensureCustomer(
    businessId: string,
    phone: string,
    source: string,
    customerName?: string | null,
  ) {
    const existingCustomer = await this.prisma.customer.findFirst({
      where: {
        businessId,
        phone,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        source: true,
      },
    });

    if (existingCustomer) {
      if (source === 'debug' && existingCustomer.source !== 'debug') {
        await this.prisma.customer.update({
          where: { id: existingCustomer.id },
          data: {
            source,
            name: customerName?.trim() || existingCustomer.name,
          },
        });

        return {
          ...existingCustomer,
          source,
          name: customerName?.trim() || existingCustomer.name,
        };
      }

      return existingCustomer;
    }

    return this.prisma.customer.create({
      data: {
        businessId,
        phone,
        name: customerName?.trim() || phone,
        source,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        source: true,
      },
    });
  }
}