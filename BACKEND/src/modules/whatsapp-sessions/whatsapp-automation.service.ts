import { Injectable } from '@nestjs/common';
import {
  AppointmentStatus,
  FlowNodeType,
  MessageDirection,
  MessageType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OutboundAction } from './whatsapp-sessions.types';

type IntentKey = 'appointments' | 'products' | 'support';
type ConversationStep = 'awaiting_name' | 'appointment_date' | 'appointment_time' | 'appointment_retry' | 'appointment_subject';

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
  dispatchReply?: (action: OutboundAction) => Promise<boolean | void>;
};

type ConversationPayload = {
  date?: string;
  time?: string;
};

const MAIN_FLOW_NAME = 'main_whatsapp_automation';
const KEYWORD_ROUTER_TITLE = '__keyword_router__';
const MENU_TRIGGER_NODE_TITLE = '__menu_triggers__';
const GREETING_KEYWORDS = ['hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'buenas', 'hey', 'hello'];

const INTENT_NODE_TYPES: Record<IntentKey, FlowNodeType> = {
  appointments: FlowNodeType.appointments,
  products: FlowNodeType.products,
  support: FlowNodeType.support,
};

const INTENT_KEYWORDS: Record<IntentKey, string[]> = {
  appointments: ['cita', 'reservar', 'reserva', 'agendar', 'turno', 'agenda'],
  products: ['producto', 'productos', 'catalogo', 'precio', 'precios', 'stock'],
  support: ['soporte', 'ayuda', 'agente', 'humano', 'asesor'],
};

const INTENT_PRIORITY: IntentKey[] = ['appointments', 'products', 'support'];

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

    const actions = await this.resolveBotReplies(input.businessId, customer.id, input.inboundContent, customer.name) as OutboundAction[];
    const savedReplies: string[] = [];

    for (const action of actions) {
      if (input.dispatchReply) {
        const delivered = await input.dispatchReply(action);
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
          messageType: this.resolveOutboundMessageType(action),
          content: this.resolveOutboundContent(action),
          mediaUrl: action.type === 'media' ? action.mediaUrl ?? null : null,
          sentAt: new Date(),
        },
      });

      const content = this.resolveOutboundContent(action)?.trim();
      if (content) {
        savedReplies.push(content);
      }
    }

    return {
      customer,
      replies: savedReplies,
    };
  }

  async resolveBotReplies(
    businessId: string,
    customerId: string,
    inboundContent: string | null,
    customerName: string | null,
  ) {
    const normalized = this.normalizeText(inboundContent);
    if (!normalized) {
      return [] as OutboundAction[];
    }

    const [flow, settings, products, conversationState] = await Promise.all([
      this.findMainFlow(businessId),
      this.prisma.businessSettings.findUnique({ where: { businessId } }),
      this.prisma.product.findMany({
        where: { businessId, isActive: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.customerConversationState.findUnique({ where: { customerId } }),
    ]);

    if (!customerName) {
      return this.handleNameCapture(businessId, customerId, normalized, flow, settings, Boolean(conversationState));
    }

    if (conversationState?.currentState?.startsWith('appointment_')) {
      return this.handleAppointmentConversation({
        businessId,
        customerId,
        customerName,
        normalized,
        rawInput: inboundContent ?? '',
        state: conversationState,
        flow,
      });
    }

    if (!flow?.isActive) {
      return [] as OutboundAction[];
    }

    const welcomeNode = this.findNode(flow, FlowNodeType.welcome);
    const menuNode = this.findNode(flow, FlowNodeType.menu);
    const menuTriggerNode =
      flow.flowNodes.find((item) => item.nodeType === FlowNodeType.text_response && item.title === MENU_TRIGGER_NODE_TITLE && item.isActive) ?? null;
    const fallbackNode = flow.flowNodes.find((item) => item.nodeType === FlowNodeType.fallback && item.isActive && item.title !== KEYWORD_ROUTER_TITLE) ?? null;

    const hasGreeting = GREETING_KEYWORDS.some((keyword) => normalized.includes(keyword)) || this.matchesNodeTriggers(welcomeNode, normalized);
    const shouldShowMenu = Boolean(menuNode) && (normalized === 'menu' || this.matchesNodeTriggers(menuTriggerNode, normalized));
    const intent = this.detectIntent(normalized);

    if (hasGreeting) {
      return this.buildGreetingSequence(customerName, settings, menuNode, welcomeNode?.content ?? settings?.welcomeMessage ?? null);
    }

    if (intent === 'products') {
      return this.buildProductActions(products, this.findNode(flow, FlowNodeType.products)?.content ?? null);
    }

    if (intent === 'appointments') {
      return this.startAppointmentConversation(businessId, customerId, this.findNode(flow, FlowNodeType.appointments)?.content ?? null);
    }

    if (intent === 'support') {
      const supportText = this.findNode(flow, FlowNodeType.support)?.content?.trim() || settings?.supportMessage?.trim() || null;
      return supportText ? [{ type: 'text', content: supportText }] : [];
    }

    if (shouldShowMenu && menuNode) {
      return [{ type: 'text', content: this.formatMenuMessage(menuNode) }];
    }

    if (fallbackNode?.content?.trim()) {
      return [{ type: 'text', content: fallbackNode.content.trim() }];
    }

    if (menuNode) {
      return [{ type: 'text', content: this.formatMenuMessage(menuNode) }];
    }

    return [] as OutboundAction[];
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

  private async handleNameCapture(
    businessId: string,
    customerId: string,
    normalizedInput: string,
    flow: FlowGraph | null,
    settings: { welcomeLogoPath?: string | null; welcomeMessage?: string | null } | null,
    hasExistingState: boolean,
  ) {
    if (!hasExistingState) {
      await this.upsertConversationState(businessId, customerId, 'awaiting_name');
      return [{ type: 'text', content: 'Hola, antes de continuar, ¿como te gustaria que te llamemos?' }];
    }

    const cleanedName = this.formatCustomerName(normalizedInput);
    if (!cleanedName) {
      return [{ type: 'text', content: 'Necesito un nombre valido para continuar. ¿Como te gustaria que te llamemos?' }];
    }

    await this.prisma.customer.update({
      where: { id: customerId },
      data: { name: cleanedName },
    });
    await this.clearConversationState(customerId);

    const menuNode = flow ? this.findNode(flow, FlowNodeType.menu) : null;
    const welcomeNode = flow ? this.findNode(flow, FlowNodeType.welcome) : null;
    return this.buildGreetingSequence(cleanedName, settings, menuNode, welcomeNode?.content ?? settings?.welcomeMessage ?? null);
  }

  private async startAppointmentConversation(businessId: string, customerId: string, intro: string | null) {
    await this.upsertConversationState(businessId, customerId, 'appointment_date');

    const actions: OutboundAction[] = [];
    if (intro?.trim()) {
      actions.push({ type: 'text', content: intro.trim() });
    }
    actions.push({ type: 'text', content: 'Por favor, ingresa la fecha de la cita en formato AAAA-MM-DD.' });
    return actions;
  }

  private async handleAppointmentConversation(input: {
    businessId: string;
    customerId: string;
    customerName: string;
    normalized: string;
    rawInput: string;
    state: { currentState: string | null; payload: Prisma.JsonValue | null };
    flow: FlowGraph | null;
  }) {
    const payload = this.parseConversationPayload(input.state.payload);

    if (input.state.currentState === 'appointment_date') {
      const date = input.rawInput.trim();
      if (!this.isValidDate(date)) {
        return [{ type: 'text', content: 'Fecha invalida. Usa el formato AAAA-MM-DD.' }];
      }

      await this.upsertConversationState(input.businessId, input.customerId, 'appointment_time', { date });
      return [{ type: 'text', content: 'Perfecto. Ahora ingresa la hora en formato HH:MM.' }];
    }

    if (input.state.currentState === 'appointment_time') {
      const time = input.rawInput.trim();
      if (!this.isValidTime(time)) {
        return [{ type: 'text', content: 'Hora invalida. Usa el formato HH:MM.' }];
      }

      const date = payload.date;
      if (!date || !(await this.isScheduleAvailable(input.businessId, date, time))) {
        await this.upsertConversationState(input.businessId, input.customerId, 'appointment_retry', { date, time });
        return [{ type: 'text', content: 'Esa fecha u hora no esta disponible. ¿Quieres intentar otra vez? Responde si o no.' }];
      }

      await this.upsertConversationState(input.businessId, input.customerId, 'appointment_subject', { date, time });
      return [{ type: 'text', content: 'Listo. Ahora cuentame el motivo o asunto de la cita.' }];
    }

    if (input.state.currentState === 'appointment_retry') {
      if (input.normalized === 'si' || input.normalized === 'sí') {
        await this.upsertConversationState(input.businessId, input.customerId, 'appointment_date');
        return [{ type: 'text', content: 'De acuerdo. Ingresa una nueva fecha en formato AAAA-MM-DD.' }];
      }

      if (input.normalized === 'no') {
        await this.clearConversationState(input.customerId);
        return [{ type: 'text', content: 'Entendido. Cuando quieras agendar una cita, escribeme de nuevo.' }];
      }

      return [{ type: 'text', content: 'Responde si para intentar otra vez o no para cancelar la cita.' }];
    }

    if (input.state.currentState === 'appointment_subject') {
      const date = payload.date;
      const time = payload.time;
      const description = input.rawInput.trim();
      if (!date || !time || !description) {
        await this.clearConversationState(input.customerId);
        return [{ type: 'text', content: 'No pude completar la cita. Intentemos de nuevo desde el inicio.' }];
      }

      const customer = await this.prisma.customer.findUniqueOrThrow({ where: { id: input.customerId } });
      await this.prisma.appointment.create({
        data: {
          businessId: input.businessId,
          customerId: input.customerId,
          appointmentDate: new Date(date),
          appointmentTime: new Date(`1970-01-01T${time}:00`),
          description,
          status: AppointmentStatus.pending,
        },
      });
      await this.clearConversationState(input.customerId);

      return [{
        type: 'text',
        content: `Tu cita quedo registrada, ${customer.name ?? input.customerName}, para el ${date} a las ${time}.`,
      }];
    }

    return [] as OutboundAction[];
  }

  private async isScheduleAvailable(businessId: string, date: string, time: string) {
    const [hour, minutes] = time.split(':').map((value) => Number(value));
    const inMorning = hour >= 8 && (hour < 12 || (hour === 12 && minutes === 0));
    const inAfternoon = hour >= 14 && hour < 18;
    if (!inMorning && !inAfternoon) {
      return false;
    }

    const existing = await this.prisma.appointment.findFirst({
      where: {
        businessId,
        appointmentDate: new Date(date),
        appointmentTime: new Date(`1970-01-01T${time}:00`),
        status: { in: [AppointmentStatus.pending, AppointmentStatus.confirmed, AppointmentStatus.completed] },
      },
      select: { id: true },
    });

    return !existing;
  }

  private buildProductActions(
    products: Array<{
      name: string;
      description: string | null;
      mediaPath: string | null;
      mediaType: string | null;
      mediaUrl: string | null;
      whatsappCaption: string | null;
    }>,
    intro: string | null,
  ) {
    const actions: OutboundAction[] = [];
    if (intro?.trim()) {
      actions.push({ type: 'text', content: intro.trim() });
    }

    for (const product of products) {
      const caption = product.whatsappCaption?.trim() || product.description?.trim() || product.name;
      if (product.mediaPath && (product.mediaType === 'image' || product.mediaType === 'video')) {
        actions.push({
          type: 'media',
          mediaKind: product.mediaType,
          mediaPath: product.mediaPath,
          mediaUrl: product.mediaUrl,
          caption,
        });
        continue;
      }

      actions.push({ type: 'text', content: caption });
    }

    return actions;
  }

  private buildGreetingSequence(
    customerName: string,
    settings: { welcomeLogoPath?: string | null } | null,
    menuNode: FlowGraph['flowNodes'][number] | null,
    welcomeText: string | null,
  ) {
    const caption = `Hola?? *${customerName}* ${welcomeText?.trim() || 'bienvenido a nuestro negocio.'}`.trim();
    const actions: OutboundAction[] = [];

    if (settings?.welcomeLogoPath) {
      actions.push({
        type: 'media',
        mediaKind: 'image',
        mediaPath: settings.welcomeLogoPath,
        mediaUrl: settings.welcomeLogoPath,
        caption,
      });
    } else {
      actions.push({ type: 'text', content: caption });
    }

    if (menuNode) {
      actions.push({ type: 'text', content: this.formatMenuMessage(menuNode) });
    }

    return actions;
  }

  private resolveOutboundMessageType(action: OutboundAction) {
    if (action.type === 'media') {
      return action.mediaKind === 'video' ? MessageType.video : action.mediaKind === 'image' ? MessageType.image : MessageType.document;
    }

    if (action.type === 'location') {
      return MessageType.location;
    }

    return MessageType.text;
  }

  private resolveOutboundContent(action: OutboundAction) {
    if (action.type === 'media') {
      return action.caption ?? null;
    }

    if (action.type === 'location') {
      return action.intro ?? action.label ?? 'Ubicacion compartida';
    }

    return action.content;
  }

  private findNode(flow: FlowGraph, nodeType: FlowNodeType) {
    return flow.flowNodes.find((item) => item.nodeType === nodeType && item.isActive) ?? null;
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
    if (message === '1') {
      return 'appointments';
    }

    if (message === '2') {
      return 'products';
    }

    if (message === '3') {
      return 'support';
    }

    for (const intent of INTENT_PRIORITY) {
      if (INTENT_KEYWORDS[intent].some((keyword) => message.includes(keyword))) {
        return intent;
      }
    }

    return null;
  }

  private formatMenuMessage(menuNode: FlowGraph['flowNodes'][number]) {
    const lines = menuNode.options.map((option, index) => `${index + 1}. ${option.optionLabel}`);
    const intro = menuNode.content?.trim() || 'Elige una opcion para continuar.';
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

  private formatCustomerName(value: string) {
    return value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 4)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  private isValidDate(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    const date = new Date(`${value}T00:00:00`);
    return !Number.isNaN(date.getTime());
  }

  private isValidTime(value: string) {
    if (!/^\d{2}:\d{2}$/.test(value)) {
      return false;
    }

    const [hour, minute] = value.split(':').map((part) => Number(part));
    return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
  }

  private parseConversationPayload(value: Prisma.JsonValue | null): ConversationPayload {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    const payload = value as Record<string, unknown>;
    return {
      date: typeof payload.date === 'string' ? payload.date : undefined,
      time: typeof payload.time === 'string' ? payload.time : undefined,
    };
  }

  private async upsertConversationState(
    businessId: string,
    customerId: string,
    currentState: ConversationStep,
    payload: ConversationPayload = {},
  ) {
    await this.prisma.customerConversationState.upsert({
      where: { customerId },
      create: {
        businessId,
        customerId,
        currentState,
        payload,
      },
      update: {
        currentState,
        payload,
      },
    });
  }

  private async clearConversationState(customerId: string) {
    await this.prisma.customerConversationState.deleteMany({ where: { customerId } });
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
      if (customerName?.trim() && !existingCustomer.name) {
        await this.prisma.customer.update({
          where: { id: existingCustomer.id },
          data: { name: customerName.trim() },
        });
        return { ...existingCustomer, name: customerName.trim() };
      }

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
        name: customerName?.trim() || null,
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


