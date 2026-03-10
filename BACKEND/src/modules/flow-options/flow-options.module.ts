import {
  Body,
  Controller,
  Delete,
  Get,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import {
  AuthenticatedUser,
  requireBusinessId,
} from '../../auth/types/authenticated-user.type';
import { PrismaService } from '../../prisma/prisma.service';

class CreateFlowOptionDto {
  @IsString()
  flowNodeId!: string;

  @IsString()
  optionLabel!: string;

  @IsString()
  optionValue!: string;

  @IsOptional()
  @IsString()
  nextNodeId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

class UpdateFlowOptionDto {
  @IsOptional()
  @IsString()
  flowNodeId?: string;

  @IsOptional()
  @IsString()
  optionLabel?: string;

  @IsOptional()
  @IsString()
  optionValue?: string;

  @IsOptional()
  @IsString()
  nextNodeId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

class FlowOptionsService {
  constructor(private readonly prisma: PrismaService) {}

  list(user: AuthenticatedUser) {
    const businessId = requireBusinessId(user);

    return this.prisma.flowOption.findMany({
      where: { flowNode: { flow: { businessId } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(user: AuthenticatedUser, id: string) {
    const businessId = requireBusinessId(user);
    const flowOption = await this.prisma.flowOption.findFirst({
      where: { id, flowNode: { flow: { businessId } } },
    });

    if (!flowOption) {
      throw new NotFoundException('Resource not found');
    }

    return flowOption;
  }

  async create(user: AuthenticatedUser, dto: CreateFlowOptionDto) {
    const businessId = requireBusinessId(user);

    await this.prisma.flowNode.findFirstOrThrow({
      where: { id: dto.flowNodeId, flow: { businessId } },
    });

    if (dto.nextNodeId) {
      await this.prisma.flowNode.findFirstOrThrow({
        where: { id: dto.nextNodeId, flow: { businessId } },
      });
    }

    return this.prisma.flowOption.create({ data: dto });
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateFlowOptionDto) {
    await this.get(user, id);
    const businessId = requireBusinessId(user);

    if (dto.flowNodeId) {
      await this.prisma.flowNode.findFirstOrThrow({
        where: { id: dto.flowNodeId, flow: { businessId } },
      });
    }

    if (dto.nextNodeId) {
      await this.prisma.flowNode.findFirstOrThrow({
        where: { id: dto.nextNodeId, flow: { businessId } },
      });
    }

    return this.prisma.flowOption.update({
      where: { id },
      data: dto,
    });
  }

  async remove(user: AuthenticatedUser, id: string) {
    await this.get(user, id);
    return this.prisma.flowOption.delete({ where: { id } });
  }
}

@Controller('flow-options')
@UseGuards(JwtAuthGuard)
class FlowOptionsController {
  constructor(private readonly flowOptionsService: FlowOptionsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.flowOptionsService.list(user);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.flowOptionsService.get(user, id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateFlowOptionDto) {
    return this.flowOptionsService.create(user, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateFlowOptionDto,
  ) {
    return this.flowOptionsService.update(user, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.flowOptionsService.remove(user, id);
  }
}

@Module({
  controllers: [FlowOptionsController],
  providers: [FlowOptionsService],
})
export class FlowOptionsModule {}
