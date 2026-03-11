import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Module,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { TenantPrismaCrudService } from '../../common/crud/tenant-prisma-crud.service';
import { PrismaService } from '../../prisma/prisma.service';

class CreatePaymentDto {
  @Type(() => Number)
  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  appointmentId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class UpdatePaymentDto extends CreatePaymentDto {}

@Injectable()
class PaymentsService extends TenantPrismaCrudService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  list(user: AuthenticatedUser) {
    return this.findAll({ model: 'payment', tenantField: 'businessId' }, user.businessId);
  }

  get(user: AuthenticatedUser, id: string) {
    return this.findOne({ model: 'payment', tenantField: 'businessId' }, id, user.businessId);
  }

  createPayment(user: AuthenticatedUser, dto: CreatePaymentDto) {
    return this.create(
      { model: 'payment', tenantField: 'businessId' },
      user.businessId,
      {
        amount: dto.amount,
        customerId: dto.customerId,
        appointmentId: dto.appointmentId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        status: dto.status,
        description: dto.description,
      },
    );
  }

  updatePayment(user: AuthenticatedUser, id: string, dto: UpdatePaymentDto) {
    return this.update(
      { model: 'payment', tenantField: 'businessId' },
      id,
      user.businessId,
      {
        amount: dto.amount,
        customerId: dto.customerId,
        appointmentId: dto.appointmentId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        status: dto.status,
        description: dto.description,
      },
    );
  }

  deletePayment(user: AuthenticatedUser, id: string) {
    return this.remove({ model: 'payment', tenantField: 'businessId' }, id, user.businessId);
  }
}

@Controller('payments')
@UseGuards(JwtAuthGuard)
class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.list(user);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.paymentsService.get(user, id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.createPayment(user, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdatePaymentDto,
  ) {
    return this.paymentsService.updatePayment(user, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.paymentsService.deletePayment(user, id);
  }
}

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
