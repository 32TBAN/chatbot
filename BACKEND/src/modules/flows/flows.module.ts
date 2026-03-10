import {
  Body,
  Controller,
  Delete,
  Get,
  Module,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import {
  AuthenticatedUser,
  requireBusinessId,
} from '../../auth/types/authenticated-user.type';
import { TenantPrismaCrudService } from '../../common/crud/tenant-prisma-crud.service';
import { PrismaService } from '../../prisma/prisma.service';

class CreateFlowDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  triggerKeyword?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class UpdateFlowDto extends CreateFlowDto {}

class FlowsService extends TenantPrismaCrudService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  list(user: AuthenticatedUser) {
    return this.findAll({ model: 'flow', tenantField: 'businessId' }, user.businessId);
  }

  get(user: AuthenticatedUser, id: string) {
    const businessId = requireBusinessId(user);

    return this.prisma.flow.findFirst({
      where: { id, businessId },
      include: { flowNodes: true },
    });
  }

  createFlow(user: AuthenticatedUser, dto: CreateFlowDto) {
    return this.create({ model: 'flow', tenantField: 'businessId' }, user.businessId, { ...dto });
  }

  updateFlow(user: AuthenticatedUser, id: string, dto: UpdateFlowDto) {
    return this.update({ model: 'flow', tenantField: 'businessId' }, id, user.businessId, { ...dto });
  }

  deleteFlow(user: AuthenticatedUser, id: string) {
    return this.remove({ model: 'flow', tenantField: 'businessId' }, id, user.businessId);
  }
}

@Controller('flows')
@UseGuards(JwtAuthGuard)
class FlowsController {
  constructor(private readonly flowsService: FlowsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.flowsService.list(user);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.flowsService.get(user, id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateFlowDto) {
    return this.flowsService.createFlow(user, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateFlowDto,
  ) {
    return this.flowsService.updateFlow(user, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.flowsService.deleteFlow(user, id);
  }
}

@Module({
  controllers: [FlowsController],
  providers: [FlowsService],
})
export class FlowsModule {}
