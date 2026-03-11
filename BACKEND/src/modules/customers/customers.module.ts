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
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { TenantPrismaCrudService } from '../../common/crud/tenant-prisma-crud.service';
import { PrismaService } from '../../prisma/prisma.service';

class CreateCustomerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

class UpdateCustomerDto extends CreateCustomerDto {}

@Injectable()
class CustomersService extends TenantPrismaCrudService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  list(user: AuthenticatedUser) {
    return this.findAll({ model: 'customer', tenantField: 'businessId' }, user.businessId);
  }

  get(user: AuthenticatedUser, id: string) {
    return this.findOne({ model: 'customer', tenantField: 'businessId' }, id, user.businessId);
  }

  createCustomer(user: AuthenticatedUser, dto: CreateCustomerDto) {
    return this.create({ model: 'customer', tenantField: 'businessId' }, user.businessId, { ...dto });
  }

  updateCustomer(user: AuthenticatedUser, id: string, dto: UpdateCustomerDto) {
    return this.update({ model: 'customer', tenantField: 'businessId' }, id, user.businessId, { ...dto });
  }

  deleteCustomer(user: AuthenticatedUser, id: string) {
    return this.remove({ model: 'customer', tenantField: 'businessId' }, id, user.businessId);
  }
}

@Controller('customers')
@UseGuards(JwtAuthGuard)
class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.customersService.list(user);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.customersService.get(user, id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCustomerDto) {
    return this.customersService.createCustomer(user, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.updateCustomer(user, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.customersService.deleteCustomer(user, id);
  }
}

@Module({
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule {}
