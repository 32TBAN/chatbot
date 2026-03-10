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
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { TenantPrismaCrudService } from '../../common/crud/tenant-prisma-crud.service';
import { PrismaService } from '../../prisma/prisma.service';

class CreateProductDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  stock?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class UpdateProductDto extends CreateProductDto {}

class ProductsService extends TenantPrismaCrudService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  list(user: AuthenticatedUser) {
    return this.findAll({ model: 'product', tenantField: 'businessId' }, user.businessId);
  }

  get(user: AuthenticatedUser, id: string) {
    return this.findOne({ model: 'product', tenantField: 'businessId' }, id, user.businessId);
  }

  createProduct(user: AuthenticatedUser, dto: CreateProductDto) {
    return this.create({ model: 'product', tenantField: 'businessId' }, user.businessId, { ...dto });
  }

  updateProduct(user: AuthenticatedUser, id: string, dto: UpdateProductDto) {
    return this.update({ model: 'product', tenantField: 'businessId' }, id, user.businessId, { ...dto });
  }

  deleteProduct(user: AuthenticatedUser, id: string) {
    return this.remove({ model: 'product', tenantField: 'businessId' }, id, user.businessId);
  }
}

@Controller('products')
@UseGuards(JwtAuthGuard)
class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.productsService.list(user);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.productsService.get(user, id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateProductDto) {
    return this.productsService.createProduct(user, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(user, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.productsService.deleteProduct(user, id);
  }
}

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
