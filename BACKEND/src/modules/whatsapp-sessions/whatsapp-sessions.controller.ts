import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { WhatsappSessionsService } from './whatsapp-sessions.service';

class DebugInboundDto {
  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  @IsIn(['text', 'image', 'video', 'document'])
  messageType?: 'text' | 'image' | 'video' | 'document';
}

@Controller('whatsapp-sessions')
@UseGuards(JwtAuthGuard)
export class WhatsappSessionsController {
  constructor(private readonly whatsappSessionsService: WhatsappSessionsService) {}

  @Get('me')
  findCurrent(@CurrentUser() user: AuthenticatedUser) {
    return this.whatsappSessionsService.getView(user);
  }

  @Post('activate')
  activate(@CurrentUser() user: AuthenticatedUser) {
    return this.whatsappSessionsService.activate(user);
  }

  @Post('pause')
  pause(@CurrentUser() user: AuthenticatedUser) {
    return this.whatsappSessionsService.pause(user);
  }

  @Post('logout')
  logout(@CurrentUser() user: AuthenticatedUser) {
    return this.whatsappSessionsService.logout(user);
  }

  @Post('debug/inbound')
  debugInbound(@CurrentUser() user: AuthenticatedUser, @Body() dto: DebugInboundDto) {
    return this.whatsappSessionsService.simulateInboundDebug(user, dto.content);
  }
}
