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
import { IsDateString, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { TenantPrismaCrudService } from '../../common/crud/tenant-prisma-crud.service';
import { PrismaService } from '../../prisma/prisma.service';

class CreateMessageDto {
  @IsString()
  direction!: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  whatsappSessionId?: string;

  @IsOptional()
  @IsString()
  messageType?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  externalMessageId?: string;

  @IsOptional()
  @IsDateString()
  sentAt?: string;

  @IsOptional()
  @IsDateString()
  deliveredAt?: string;

  @IsOptional()
  @IsDateString()
  readAt?: string;
}

class UpdateMessageDto extends CreateMessageDto {}

@Injectable()
class MessagesService extends TenantPrismaCrudService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  list(user: AuthenticatedUser) {
    return this.findAll({ model: 'message', tenantField: 'businessId' }, user.businessId);
  }

  get(user: AuthenticatedUser, id: string) {
    return this.findOne({ model: 'message', tenantField: 'businessId' }, id, user.businessId);
  }

  createMessage(user: AuthenticatedUser, dto: CreateMessageDto) {
    return this.create(
      { model: 'message', tenantField: 'businessId' },
      user.businessId,
      {
        direction: dto.direction,
        customerId: dto.customerId,
        whatsappSessionId: dto.whatsappSessionId,
        messageType: dto.messageType,
        content: dto.content,
        mediaUrl: dto.mediaUrl,
        externalMessageId: dto.externalMessageId,
        sentAt: dto.sentAt ? new Date(dto.sentAt) : undefined,
        deliveredAt: dto.deliveredAt ? new Date(dto.deliveredAt) : undefined,
        readAt: dto.readAt ? new Date(dto.readAt) : undefined,
      },
    );
  }

  updateMessage(user: AuthenticatedUser, id: string, dto: UpdateMessageDto) {
    return this.update(
      { model: 'message', tenantField: 'businessId' },
      id,
      user.businessId,
      {
        direction: dto.direction,
        customerId: dto.customerId,
        whatsappSessionId: dto.whatsappSessionId,
        messageType: dto.messageType,
        content: dto.content,
        mediaUrl: dto.mediaUrl,
        externalMessageId: dto.externalMessageId,
        sentAt: dto.sentAt ? new Date(dto.sentAt) : undefined,
        deliveredAt: dto.deliveredAt ? new Date(dto.deliveredAt) : undefined,
        readAt: dto.readAt ? new Date(dto.readAt) : undefined,
      },
    );
  }

  deleteMessage(user: AuthenticatedUser, id: string) {
    return this.remove({ model: 'message', tenantField: 'businessId' }, id, user.businessId);
  }
}

@Controller('messages')
@UseGuards(JwtAuthGuard)
class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.messagesService.list(user);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.messagesService.get(user, id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateMessageDto) {
    return this.messagesService.createMessage(user, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateMessageDto,
  ) {
    return this.messagesService.updateMessage(user, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.messagesService.deleteMessage(user, id);
  }
}

@Module({
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
