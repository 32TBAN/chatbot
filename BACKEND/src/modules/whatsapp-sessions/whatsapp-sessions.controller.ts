import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { WhatsappSessionsService } from './whatsapp-sessions.service';

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
}
