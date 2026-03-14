import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Injectable,
  Module,
  Put,
  UseGuards,
} from '@nestjs/common';
import { FlowNodeType, Prisma } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  AuthenticatedUser,
  requireBusinessId,
} from '../../auth/types/authenticated-user.type';
import { PrismaService } from '../../prisma/prisma.service';

type AutomationKey = 'welcome' | 'menu' | 'appointments' | 'products' | 'location' | 'support';

type FlowWithGraph = Prisma.FlowGetPayload<{
  include: {
    flowNodes: {
      include: {
        options: {
          include: { nextNode: true };
          orderBy: { sortOrder: 'asc' };
        };
      };
      orderBy: { sortOrder: 'asc' };
    };
  };
}>;

type ExistingNode = FlowWithGraph['flowNodes'][number];

const MAIN_FLOW_NAME = 'main_whatsapp_automation';
const KEYWORD_ROUTER_TITLE = '__keyword_router__';
const KEYWORD_NODE_PREFIX = '__keyword__';
const MENU_TRIGGER_NODE_TITLE = '__menu_triggers__';

const QUICK_AUTOMATIONS: Array<{
  key: AutomationKey;
  title: string;
  description: string;
  nodeType: FlowNodeType;
  defaultNodeTitle: string;
  defaultMessage: string;
  defaultTriggers: string[];
  sortOrder: number;
}> = [
  {
    key: 'welcome',
    title: 'Mensaje de bienvenida',
    description: 'Cuando el cliente saluda o inicia la conversacion.',
    nodeType: FlowNodeType.welcome,
    defaultNodeTitle: 'Bienvenida',
    defaultMessage: 'Hola Ã°Å¸â€˜â€¹ Bienvenido a nuestro negocio. Estoy aqui para ayudarte en lo que necesites.',
    defaultTriggers: ['hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'buenas'],
    sortOrder: 10,
  },
  {
    key: 'menu',
    title: 'Menu principal',
    description: 'Ofrece opciones como citas, productos, ubicacion o soporte.',
    nodeType: FlowNodeType.menu,
    defaultNodeTitle: 'Menu principal',
    defaultMessage: 'Ã¢Å“Â¨ Elige una opcion para continuar.',
    defaultTriggers: ['menu', 'opciones', 'informacion', 'que ofrecen'],
    sortOrder: 20,
  },
  {
    key: 'appointments',
    title: 'Reserva de citas',
    description: 'Permite que el cliente agende una cita automaticamente.',
    nodeType: FlowNodeType.appointments,
    defaultNodeTitle: 'Reserva de citas',
    defaultMessage: 'Ã°Å¸â€œâ€¦ Claro, puedo ayudarte con tu reserva. Comparte el dia y la hora que prefieres.',
    defaultTriggers: ['reserva', 'reservar', 'cita', 'agendar', 'agenda'],
    sortOrder: 30,
  },
  {
    key: 'products',
    title: 'Catalogo de productos',
    description: 'Permite que el cliente consulte productos disponibles.',
    nodeType: FlowNodeType.products,
    defaultNodeTitle: 'Catalogo de productos',
    defaultMessage: 'Ã°Å¸â€ºÂÃ¯Â¸Â Te comparto la informacion de productos y servicios disponibles ahora mismo.',
    defaultTriggers: ['producto', 'productos', 'catalogo', 'precio', 'precios', 'stock'],
    sortOrder: 40,
  },
  {
    key: 'location',
    title: 'Ubicacion del negocio',
    description: 'Comparte la ubicacion configurada del negocio por WhatsApp.',
    nodeType: FlowNodeType.location,
    defaultNodeTitle: 'Ubicacion del negocio',
    defaultMessage: 'Te comparto la ubicacion del negocio para que puedas llegar con facilidad.',
    defaultTriggers: ['ubicacion', 'direccion', 'mapa', 'donde estan', 'como llegar'],
    sortOrder: 50,
  },
  {
    key: 'support',
    title: 'Soporte humano',
    description: 'Escala la conversacion a un agente.',
    nodeType: FlowNodeType.support,
    defaultNodeTitle: 'Soporte humano',
    defaultMessage: 'Ã°Å¸â€ºÂ Ã¯Â¸Â Vamos a ayudarte con eso. Cuentame un poco mas del problema o consulta.',
    defaultTriggers: ['soporte', 'ayuda', 'problema', 'error', 'falla'],
    sortOrder: 60,
  },
];

const DEFAULT_MENU_OPTIONS: Array<{ label: string; targetKey: AutomationKey }> = [
  { label: 'Reservar cita', targetKey: 'appointments' },
  { label: 'Ver productos', targetKey: 'products' },
  { label: 'Ver ubicacion', targetKey: 'location' },
  { label: 'Hablar con soporte', targetKey: 'support' },
];

class QuickAutomationInputDto {
  @IsString()
  key!: AutomationKey;

  @IsBoolean()
  enabled!: boolean;

  @IsString()
  @MaxLength(2000)
  message!: string;

  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  triggers!: string[];
}

class MenuOptionInputDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MaxLength(120)
  label!: string;

  @IsString()
  targetKey!: AutomationKey;
}

class MenuConfigInputDto {
  @IsString()
  @MaxLength(2000)
  message!: string;

  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => MenuOptionInputDto)
  options!: MenuOptionInputDto[];
}

class KeywordInputDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MaxLength(100)
  keyword!: string;

  @IsString()
  @MaxLength(120)
  label!: string;

  @IsString()
  @MaxLength(2000)
  response!: string;
}

class UpdateAutomationMainFlowDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuickAutomationInputDto)
  quickAutomations!: QuickAutomationInputDto[];

  @ValidateNested()
  @Type(() => MenuConfigInputDto)
  menu!: MenuConfigInputDto;

  @IsArray()
  @ArrayMaxSize(25)
  @ValidateNested({ each: true })
  @Type(() => KeywordInputDto)
  keywords!: KeywordInputDto[];
}

@Injectable()
class AutomationMainFlowService {
  constructor(private readonly prisma: PrismaService) {}

  async getView(user: AuthenticatedUser) {
    const businessId = requireBusinessId(user);
    const flow = await this.findMainFlow(businessId);
    return this.toView(flow);
  }

  async save(user: AuthenticatedUser, dto: UpdateAutomationMainFlowDto) {
    const businessId = requireBusinessId(user);
    this.validateDto(dto);

    const existingFlow = await this.findMainFlow(businessId);
    const existingNodes = existingFlow?.flowNodes ?? [];

    const flowId = await this.prisma.$transaction(async (tx) => {
      const ensuredFlowId = existingFlow?.id ?? (
        await tx.flow.create({
          data: {
            businessId,
            name: MAIN_FLOW_NAME,
            isActive: dto.isActive ?? true,
          },
        })
      ).id;

      await tx.flow.update({
        where: { id: ensuredFlowId },
        data: { isActive: dto.isActive ?? true },
      });

      const standardNodes = new Map<AutomationKey, { id: string; nodeType: FlowNodeType; isActive: boolean; content: string | null }>();

      for (const config of QUICK_AUTOMATIONS) {
        const existingNode = existingNodes.find((node) => node.nodeType === config.nodeType);
        const payload = dto.quickAutomations.find((item) => item.key === config.key);
        const nodeData = {
          title: config.defaultNodeTitle,
          content: payload?.message?.trim() || config.defaultMessage,
          isActive: payload?.enabled ?? false,
          sortOrder: config.sortOrder,
        };

        const node = existingNode
          ? await tx.flowNode.update({
              where: { id: existingNode.id },
              data: nodeData,
            })
          : await tx.flowNode.create({
              data: {
                flowId: ensuredFlowId,
                nodeType: config.nodeType,
                ...nodeData,
              },
            });

        standardNodes.set(config.key, node);

        if (config.key !== 'menu') {
          await tx.flowOption.deleteMany({ where: { flowNodeId: node.id } });
          const triggers = (payload?.triggers ?? config.defaultTriggers)
            .map((trigger) => trigger.trim())
            .filter(Boolean);

          if (triggers.length > 0) {
            await tx.flowOption.createMany({
              data: triggers.map((trigger, index) => ({
                flowNodeId: node.id,
                optionLabel: trigger,
                optionValue: trigger,
                sortOrder: index + 1,
              })),
            });
          }
        }
      }

      const menuNode = standardNodes.get('menu');
      if (!menuNode) {
        throw new BadRequestException('Menu node unavailable');
      }

      const menuTriggerNode = await this.ensureMenuTriggerNode(tx, ensuredFlowId, existingNodes);
      await tx.flowOption.deleteMany({ where: { flowNodeId: menuTriggerNode.id } });

      const menuPayload = dto.quickAutomations.find((item) => item.key === 'menu');
      const menuTriggers = (menuPayload?.triggers ?? QUICK_AUTOMATIONS.find((item) => item.key === 'menu')?.defaultTriggers ?? [])
        .map((trigger) => trigger.trim())
        .filter(Boolean);

      if (menuTriggers.length > 0) {
        await tx.flowOption.createMany({
          data: menuTriggers.map((trigger, index) => ({
            flowNodeId: menuTriggerNode.id,
            optionLabel: trigger,
            optionValue: trigger,
            sortOrder: index + 1,
          })),
        });
      }

      await tx.flowOption.deleteMany({ where: { flowNodeId: menuNode.id } });

      if (dto.menu.options.length > 0) {
        await tx.flowOption.createMany({
          data: dto.menu.options.map((option, index) => {
            const targetNode = standardNodes.get(option.targetKey);
            if (!targetNode) {
              throw new BadRequestException(`Invalid menu target: ${option.targetKey}`);
            }

            return {
              flowNodeId: menuNode.id,
              optionLabel: option.label.trim(),
              optionValue: String(index + 1),
              nextNodeId: targetNode.id,
              sortOrder: index + 1,
            };
          }),
        });
      }

      const keywordRouter = await this.ensureKeywordRouterNode(tx, ensuredFlowId, existingNodes);
      const existingKeywordNodes = existingNodes.filter(
        (node) => node.nodeType === FlowNodeType.text_response && node.title.startsWith(KEYWORD_NODE_PREFIX),
      );
      const existingKeywordMap = new Map(existingKeywordNodes.map((node) => [node.id, node]));
      const keywordNodeIdsToKeep = new Set<string>();
      const keywordOptionRows: Array<{
        flowNodeId: string;
        optionLabel: string;
        optionValue: string;
        nextNodeId: string;
        sortOrder: number;
      }> = [];

      for (const [index, keyword] of dto.keywords.entries()) {
        const normalizedKeyword = keyword.keyword.trim().toLowerCase();
        const existingNode = keyword.id ? existingKeywordMap.get(keyword.id) : undefined;

        const node = existingNode
          ? await tx.flowNode.update({
              where: { id: existingNode.id },
              data: {
                title: `${KEYWORD_NODE_PREFIX}:${normalizedKeyword}`,
                content: keyword.response.trim(),
                isActive: true,
                sortOrder: 100 + index,
              },
            })
          : await tx.flowNode.create({
              data: {
                flowId: ensuredFlowId,
                nodeType: FlowNodeType.text_response,
                title: `${KEYWORD_NODE_PREFIX}:${normalizedKeyword}`,
                content: keyword.response.trim(),
                isActive: true,
                sortOrder: 100 + index,
              },
            });

        keywordNodeIdsToKeep.add(node.id);
        keywordOptionRows.push({
          flowNodeId: keywordRouter.id,
          optionLabel: keyword.label.trim(),
          optionValue: normalizedKeyword,
          nextNodeId: node.id,
          sortOrder: index + 1,
        });
      }

      await tx.flowOption.deleteMany({ where: { flowNodeId: keywordRouter.id } });

      if (keywordOptionRows.length > 0) {
        await tx.flowOption.createMany({ data: keywordOptionRows });
      }

      const obsoleteKeywordNodeIds = existingKeywordNodes
        .filter((node) => !keywordNodeIdsToKeep.has(node.id))
        .map((node) => node.id);

      if (obsoleteKeywordNodeIds.length > 0) {
        await tx.flowNode.deleteMany({ where: { id: { in: obsoleteKeywordNodeIds } } });
      }

      return ensuredFlowId;
    });

    const flow = await this.findMainFlowById(flowId);
    return this.toView(flow);
  }

  private validateDto(dto: UpdateAutomationMainFlowDto) {
    const quickKeys = new Set(dto.quickAutomations.map((item) => item.key));
    for (const config of QUICK_AUTOMATIONS) {
      if (!quickKeys.has(config.key)) {
        throw new BadRequestException(`Missing automation key: ${config.key}`);
      }
    }

    for (const automation of dto.quickAutomations) {
      const seenTriggers = new Set<string>();
      for (const trigger of automation.triggers ?? []) {
        const normalized = trigger.trim().toLowerCase();
        if (!normalized) {
          throw new BadRequestException(`Trigger vacio en ${automation.key}`);
        }
        if (seenTriggers.has(normalized)) {
          throw new BadRequestException(`Trigger duplicado en ${automation.key}: ${normalized}`);
        }
        seenTriggers.add(normalized);
      }
    }

    const keywordSet = new Set<string>();
    for (const keyword of dto.keywords) {
      const normalized = keyword.keyword.trim().toLowerCase();
      if (!normalized) {
        throw new BadRequestException('Keyword cannot be empty');
      }
      if (!keyword.label.trim()) {
        throw new BadRequestException('Keyword label cannot be empty');
      }
      if (!keyword.response.trim()) {
        throw new BadRequestException('Keyword response cannot be empty');
      }
      if (keywordSet.has(normalized)) {
        throw new BadRequestException(`Duplicate keyword: ${normalized}`);
      }
      keywordSet.add(normalized);
    }

    for (const option of dto.menu.options) {
      if (!option.label.trim()) {
        throw new BadRequestException('Menu option label cannot be empty');
      }
      if (!QUICK_AUTOMATIONS.some((item) => item.key === option.targetKey)) {
        throw new BadRequestException(`Invalid menu target: ${option.targetKey}`);
      }
      if (option.targetKey === 'welcome' || option.targetKey === 'menu') {
        throw new BadRequestException(`Invalid menu target: ${option.targetKey}`);
      }
    }
  }

  private findMainFlow(businessId: string) {
    return this.prisma.flow.findFirst({
      where: { businessId, name: MAIN_FLOW_NAME },
      include: {
        flowNodes: {
          include: {
            options: {
              include: { nextNode: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  private findMainFlowById(id: string) {
    return this.prisma.flow.findUnique({
      where: { id },
      include: {
        flowNodes: {
          include: {
            options: {
              include: { nextNode: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  private async ensureMenuTriggerNode(
    tx: Prisma.TransactionClient,
    flowId: string,
    existingNodes: ExistingNode[],
  ) {
    const existingNode = existingNodes.find(
      (node) => node.nodeType === FlowNodeType.text_response && node.title === MENU_TRIGGER_NODE_TITLE,
    );

    if (existingNode) {
      return tx.flowNode.update({
        where: { id: existingNode.id },
        data: {
          title: MENU_TRIGGER_NODE_TITLE,
          content: null,
          isActive: true,
          sortOrder: 19,
        },
      });
    }

    return tx.flowNode.create({
      data: {
        flowId,
        nodeType: FlowNodeType.text_response,
        title: MENU_TRIGGER_NODE_TITLE,
        content: null,
        isActive: true,
        sortOrder: 19,
      },
    });
  }

  private async ensureKeywordRouterNode(
    tx: Prisma.TransactionClient,
    flowId: string,
    existingNodes: ExistingNode[],
  ) {
    const existingNode = existingNodes.find(
      (node) => node.nodeType === FlowNodeType.fallback && node.title === KEYWORD_ROUTER_TITLE,
    );

    if (existingNode) {
      return tx.flowNode.update({
        where: { id: existingNode.id },
        data: { isActive: true, sortOrder: 90 },
      });
    }

    return tx.flowNode.create({
      data: {
        flowId,
        nodeType: FlowNodeType.fallback,
        title: KEYWORD_ROUTER_TITLE,
        content: null,
        isActive: true,
        sortOrder: 90,
      },
    });
  }

  private toView(flow: FlowWithGraph | null) {
    const standardNodes = new Map<AutomationKey, ExistingNode | null>();
    for (const config of QUICK_AUTOMATIONS) {
      const node = flow?.flowNodes?.find((item) => item.nodeType === config.nodeType) ?? null;
      standardNodes.set(config.key, node);
    }

    const menuNode = standardNodes.get('menu');
    const menuTriggerNode = flow?.flowNodes?.find(
      (node) => node.nodeType === FlowNodeType.text_response && node.title === MENU_TRIGGER_NODE_TITLE,
    );
    const keywordRouter = flow?.flowNodes?.find(
      (node) => node.nodeType === FlowNodeType.fallback && node.title === KEYWORD_ROUTER_TITLE,
    );
    const menuOptions =
      menuNode?.options?.map((option, index) => ({
        id: option.id,
        label: option.optionLabel,
        targetKey: this.findQuickKeyByNodeType(option.nextNode?.nodeType) ?? 'support',
        position: index + 1,
      })) ??
      DEFAULT_MENU_OPTIONS.map((item, index) => ({
        id: `default-${index + 1}`,
        label: item.label,
        targetKey: item.targetKey,
        position: index + 1,
      }));

    return {
      flowId: flow?.id ?? null,
      flowName: 'Bot principal de WhatsApp',
      isActive: flow?.isActive ?? true,
      quickAutomations: QUICK_AUTOMATIONS.map((config) => ({
        key: config.key,
        title: config.title,
        description: config.description,
        enabled: standardNodes.get(config.key)?.isActive ?? (config.key === 'welcome' || config.key === 'menu'),
        nodeId: standardNodes.get(config.key)?.id ?? null,
        message: standardNodes.get(config.key)?.content ?? config.defaultMessage,
        triggers:
          config.key === 'menu'
            ? menuTriggerNode?.options?.map((option) => option.optionValue) ?? config.defaultTriggers
            : standardNodes.get(config.key)?.options?.map((option) => option.optionValue) ?? config.defaultTriggers,
      })),
      menu: {
        message:
          menuNode?.content ??
          QUICK_AUTOMATIONS.find((item) => item.key === 'menu')?.defaultMessage ??
          'Ã¢Å“Â¨ Elige una opcion para continuar.',
        options: menuOptions,
      },
      keywords:
        keywordRouter?.options?.map((option) => ({
          id: option.nextNode?.id ?? option.id,
          keyword: option.optionValue,
          label: option.optionLabel,
          response: option.nextNode?.content ?? '',
        })) ?? [],
      nodeRegistry: QUICK_AUTOMATIONS.map((config) => ({
        key: config.key,
        label: config.title,
        enabled: standardNodes.get(config.key)?.isActive ?? (config.key === 'welcome' || config.key === 'menu'),
        nodeId: standardNodes.get(config.key)?.id ?? null,
      })),
    };
  }

  private findQuickKeyByNodeType(nodeType?: FlowNodeType | null): AutomationKey | null {
    if (!nodeType) {
      return null;
    }

    return QUICK_AUTOMATIONS.find((item) => item.nodeType === nodeType)?.key ?? null;
  }
}

@Controller('automation-main-flow')
@UseGuards(JwtAuthGuard)
class AutomationMainFlowController {
  constructor(private readonly automationMainFlowService: AutomationMainFlowService) {}

  @Get()
  findOne(@CurrentUser() user: AuthenticatedUser) {
    return this.automationMainFlowService.getView(user);
  }

  @Put()
  update(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateAutomationMainFlowDto) {
    return this.automationMainFlowService.save(user, dto);
  }
}

@Module({
  controllers: [AutomationMainFlowController],
  providers: [AutomationMainFlowService],
})
export class AutomationMainFlowModule {}