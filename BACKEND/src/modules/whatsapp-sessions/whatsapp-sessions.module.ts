import { Module } from '@nestjs/common';
import { WhatsappSessionsController } from './whatsapp-sessions.controller';
import { WhatsappRuntimeService } from './whatsapp-runtime.service';
import { WhatsappSessionsService } from './whatsapp-sessions.service';

@Module({
  controllers: [WhatsappSessionsController],
  providers: [WhatsappRuntimeService, WhatsappSessionsService],
})
export class WhatsappSessionsModule {}
