import { Module } from '@nestjs/common';
import { WhatsappSessionsController } from './whatsapp-sessions.controller';
import { WhatsappRuntimeService } from './whatsapp-runtime.service';
import { WhatsappSessionsService } from './whatsapp-sessions.service';
import { WhatsappAutomationService } from './whatsapp-automation.service';

@Module({
  controllers: [WhatsappSessionsController],
  providers: [WhatsappAutomationService, WhatsappRuntimeService, WhatsappSessionsService],
  exports: [WhatsappRuntimeService, WhatsappAutomationService],
})
export class WhatsappSessionsModule {}