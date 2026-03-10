import {
  Body,
  Controller,
  Get,
  Module,
  Patch,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { PrismaService } from '../../prisma/prisma.service';

class UpdateBusinessSettingsDto {
  @IsOptional()
  @IsString()
  welcomeMessage?: string;

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
}

class BusinessSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  get(businessId: string) {
    return this.prisma.businessSettings.findUnique({
      where: { businessId },
    });
  }

  update(user: AuthenticatedUser, dto: UpdateBusinessSettingsDto) {
    if (!['owner', 'admin'].includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.prisma.businessSettings.upsert({
      where: { businessId: user.businessId },
      create: {
        businessId: user.businessId,
        ...dto,
      },
      update: dto,
    });
  }
}

@Controller('business-settings')
@UseGuards(JwtAuthGuard)
class BusinessSettingsController {
  constructor(private readonly businessSettingsService: BusinessSettingsService) {}

  @Get()
  get(@CurrentUser() user: AuthenticatedUser) {
    return this.businessSettingsService.get(user.businessId);
  }

  @Patch()
  update(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateBusinessSettingsDto) {
    return this.businessSettingsService.update(user, dto);
  }
}

@Module({
  controllers: [BusinessSettingsController],
  providers: [BusinessSettingsService],
})
export class BusinessSettingsModule {}
