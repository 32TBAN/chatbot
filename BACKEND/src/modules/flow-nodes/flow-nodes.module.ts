import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import {
  AuthenticatedUser,
  requireBusinessId,
} from '../../auth/types/authenticated-user.type';
import { PrismaService } from '../../prisma/prisma.service';

class CreateFlowNodeDto {
  @IsString()
  flowId!: string;

  @IsString()
  nodeType!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class UpdateFlowNodeDto {
  @IsOptional()
  @IsString()
  flowId?: string;

  @IsOptional()
  @IsString()
  nodeType?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@Injectable()
class FlowNodesService {
  constructor(private readonly prisma: PrismaService) {}

  list(user: AuthenticatedUser) {
    const businessId = requireBusinessId(user);

    return this.prisma.flowNode.findMany({
      where: { flow: { businessId } },
      include: { options: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(user: AuthenticatedUser, id: string) {
    const businessId = requireBusinessId(user);
    const flowNode = await this.prisma.flowNode.findFirst({
      where: { id, flow: { businessId } },
      include: { options: true },
    });

    if (!flowNode) {
      throw new NotFoundException('Resource not found');
    }

    return flowNode;
  }

  async create(user: AuthenticatedUser, dto: CreateFlowNodeDto) {
    const businessId = requireBusinessId(user);

    await this.prisma.flow.findFirstOrThrow({
      where: { id: dto.flowId, businessId },
    });

    return this.prisma.flowNode.create({
      data: {
        flowId: dto.flowId,
        nodeType: dto.nodeType as any,
        title: dto.title,
        content: dto.content,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
    });
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateFlowNodeDto) {
    await this.get(user, id);
    const businessId = requireBusinessId(user);

    if (dto.flowId) {
      await this.prisma.flow.findFirstOrThrow({
        where: { id: dto.flowId, businessId },
      });
    }

    return this.prisma.flowNode.update({
      where: { id },
      data: {
        flowId: dto.flowId,
        nodeType: dto.nodeType as any,
        title: dto.title,
        content: dto.content,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
    });
  }

  async remove(user: AuthenticatedUser, id: string) {
    await this.get(user, id);
    return this.prisma.flowNode.delete({ where: { id } });
  }
}

@Controller('flow-nodes')
@UseGuards(JwtAuthGuard)
class FlowNodesController {
  constructor(private readonly flowNodesService: FlowNodesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.flowNodesService.list(user);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.flowNodesService.get(user, id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateFlowNodeDto) {
    return this.flowNodesService.create(user, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateFlowNodeDto,
  ) {
    return this.flowNodesService.update(user, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.flowNodesService.remove(user, id);
  }
}

@Module({
  controllers: [FlowNodesController],
  providers: [FlowNodesService],
})
export class FlowNodesModule {}
