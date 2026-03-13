import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Injectable,
  Module,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsOptional, IsString, IsNumber } from 'class-validator';
import { promises as fs } from 'fs';
import path from 'path';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuthenticatedUser, requireBusinessId } from '../../auth/types/authenticated-user.type';
import { buildBusinessMediaDirectory, buildPublicMediaUrl, buildStoredFilename } from '../../common/media-storage';
import { PrismaService } from '../../prisma/prisma.service';

const { memoryStorage } = require('multer') as { memoryStorage: () => unknown };
const TARGETING_MODES = ['all', 'exclude', 'allow_only'] as const;

class UpdateBusinessSettingsDto {
  @IsOptional()
  @IsString()
  welcomeMessage?: string;

  @IsOptional()
  @IsString()
  @IsIn(TARGETING_MODES)
  targetingMode?: (typeof TARGETING_MODES)[number];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  targetingNumbers?: string[];

  @IsOptional()
  @IsString()
  fallbackMessage?: string;

  @IsOptional()
  @IsString()
  supportMessage?: string;

  @IsOptional()
  @IsBoolean()
  askForName?: boolean;

  @IsOptional()
  @IsBoolean()
  askForEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  askForRegistration?: boolean;

  @IsOptional()
  @IsBoolean()
  appointmentsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  productsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  supportEnabled?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  locationLatitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  locationLongitude?: number;

  @IsOptional()
  @IsString()
  locationLabel?: string;

  @IsOptional()
  @IsString()
  locationAddress?: string;

  @IsOptional()
  @IsString()
  locationGoogleMapsUrl?: string;
}

@Injectable()
class BusinessSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  get(businessId: string) {
    return this.prisma.businessSettings.findUnique({ where: { businessId } });
  }

  async update(user: AuthenticatedUser, dto: UpdateBusinessSettingsDto) {
    if (!['owner', 'admin'].includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const businessId = requireBusinessId(user);
    const targetingNumbers = dto.targetingNumbers?.map((value) => value.trim()).filter(Boolean);

    return this.prisma.businessSettings.upsert({
      where: { businessId },
      create: {
        businessId,
        ...dto,
        targetingNumbers: targetingNumbers ?? [],
      },
      update: {
        ...dto,
        ...(targetingNumbers ? { targetingNumbers } : {}),
      },
    });
  }

  async uploadWelcomeLogo(user: AuthenticatedUser, file: any) {
    if (!['owner', 'admin'].includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (!file) {
      throw new BadRequestException('Debes seleccionar una imagen para el logo.');
    }

    if (!String(file.mimetype ?? '').startsWith('image/')) {
      throw new BadRequestException('El logo de bienvenida debe ser una imagen.');
    }

    const businessId = requireBusinessId(user);
    const filename = buildStoredFilename(file.originalname || 'welcome-logo');
    const uploadDir = buildBusinessMediaDirectory(businessId, 'welcome-logo');
    const absolutePath = path.join(uploadDir, filename);
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(absolutePath, file.buffer);

    return this.prisma.businessSettings.upsert({
      where: { businessId },
      create: {
        businessId,
        welcomeLogoUrl: buildPublicMediaUrl(businessId, 'welcome-logo', filename),
        welcomeLogoPath: absolutePath,
        welcomeLogoFilename: file.originalname,
        welcomeLogoMimeType: file.mimetype,
      },
      update: {
        welcomeLogoUrl: buildPublicMediaUrl(businessId, 'welcome-logo', filename),
        welcomeLogoPath: absolutePath,
        welcomeLogoFilename: file.originalname,
        welcomeLogoMimeType: file.mimetype,
      },
    });
  }
}

@Controller('business-settings')
@UseGuards(JwtAuthGuard)
class BusinessSettingsController {
  constructor(private readonly businessSettingsService: BusinessSettingsService) {}

  @Get()
  get(@CurrentUser() user: AuthenticatedUser) {
    return this.businessSettingsService.get(requireBusinessId(user));
  }

  @Patch()
  update(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateBusinessSettingsDto) {
    return this.businessSettingsService.update(user, dto);
  }

  @Post('welcome-logo')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadWelcomeLogo(@CurrentUser() user: AuthenticatedUser, @UploadedFile() file: any) {
    return this.businessSettingsService.uploadWelcomeLogo(user, file);
  }
}

@Module({
  controllers: [BusinessSettingsController],
  providers: [BusinessSettingsService],
  exports: [BusinessSettingsService],
})
export class BusinessSettingsModule {}
