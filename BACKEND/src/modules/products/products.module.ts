import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Injectable,
  Module,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { promises as fs } from 'fs';
import path from 'path';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuthenticatedUser, requireBusinessId } from '../../auth/types/authenticated-user.type';
import { TenantPrismaCrudService } from '../../common/crud/tenant-prisma-crud.service';
import { buildBusinessMediaDirectory, buildPublicMediaUrl, buildStoredFilename } from '../../common/media-storage';
import { PrismaService } from '../../prisma/prisma.service';

const { memoryStorage } = require('multer') as { memoryStorage: () => unknown };

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

  @IsOptional()
  @IsString()
  whatsappCaption?: string;
}

class UpdateProductDto extends CreateProductDto {}

@Injectable()
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

  async uploadMedia(user: AuthenticatedUser, id: string, file: any) {
    if (!['owner', 'admin'].includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (!file) {
      throw new BadRequestException('Debes seleccionar una imagen o video.');
    }

    const businessId = requireBusinessId(user);
    const product = await this.get(user, id);
    const mediaType = String(file.mimetype ?? '').startsWith('image/') ? 'image' : String(file.mimetype ?? '').startsWith('video/') ? 'video' : null;
    if (!mediaType) {
      throw new BadRequestException('Solo se permiten archivos de imagen o video.');
    }

    const filename = buildStoredFilename(file.originalname || `${product.name}-media`);
    const uploadDir = buildBusinessMediaDirectory(businessId, 'products');
    const absolutePath = path.join(uploadDir, filename);
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(absolutePath, file.buffer);

    return this.update({ model: 'product', tenantField: 'businessId' }, id, user.businessId, {
      mediaType,
      mediaUrl: buildPublicMediaUrl(businessId, 'products', filename),
      mediaPath: absolutePath,
      mediaFilename: file.originalname,
      mediaMimeType: file.mimetype,
    });
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
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.updateProduct(user, id, dto);
  }

  @Post(':id/media')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadMedia(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @UploadedFile() file: any) {
    return this.productsService.uploadMedia(user, id, file);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.productsService.deleteProduct(user, id);
  }
}

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
