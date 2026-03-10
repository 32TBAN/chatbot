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
import { IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { PrismaService } from '../../prisma/prisma.service';

class CreateWhatsappSessionDto {
  @IsString()
  sessionKey!: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  qrCode?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

class UpdateWhatsappSessionDto extends CreateWhatsappSessionDto {}

class WhatsappSessionsService {
  constructor(private readonly prisma: PrismaService) {}

  list(businessId: string) {
    return this.prisma.whatsappSession.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(businessId: string, id: string) {
    const session = await this.prisma.whatsappSession.findFirst({
      where: { id, businessId },
    });

    if (!session) {
      throw new NotFoundException('Resource not found');
    }

    return session;
  }

  create(user: AuthenticatedUser, dto: CreateWhatsappSessionDto) {
    return this.prisma.whatsappSession.create({
      data: {
        businessId: user.businessId,
        sessionKey: dto.sessionKey,
        phoneNumber: dto.phoneNumber,
        qrCode: dto.qrCode,
        status: dto.status as any,
      },
    });
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateWhatsappSessionDto) {
    await this.get(user.businessId, id);
    return this.prisma.whatsappSession.update({
      where: { id },
      data: {
        sessionKey: dto.sessionKey,
        phoneNumber: dto.phoneNumber,
        qrCode: dto.qrCode,
        status: dto.status as any,
      },
    });
  }

  async remove(user: AuthenticatedUser, id: string) {
    await this.get(user.businessId, id);
    return this.prisma.whatsappSession.delete({ where: { id } });
  }
}

@Controller('whatsapp-sessions')
@UseGuards(JwtAuthGuard)
class WhatsappSessionsController {
  constructor(private readonly whatsappSessionsService: WhatsappSessionsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.whatsappSessionsService.list(user.businessId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.whatsappSessionsService.get(user.businessId, id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateWhatsappSessionDto) {
    return this.whatsappSessionsService.create(user, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateWhatsappSessionDto,
  ) {
    return this.whatsappSessionsService.update(user, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.whatsappSessionsService.remove(user, id);
  }
}

@Module({
  controllers: [WhatsappSessionsController],
  providers: [WhatsappSessionsService],
})
export class WhatsappSessionsModule {}
