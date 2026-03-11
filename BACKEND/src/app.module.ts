import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { BusinessesModule } from './modules/businesses/businesses.module';
import { UsersModule } from './modules/users/users.module';
import { BusinessSettingsModule } from './modules/business-settings/business-settings.module';
import { WhatsappSessionsModule } from './modules/whatsapp-sessions/whatsapp-sessions.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ProductsModule } from './modules/products/products.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { MessagesModule } from './modules/messages/messages.module';
import { MessageInboxModule } from './modules/message-inbox/message-inbox.module';
import { FlowsModule } from './modules/flows/flows.module';
import { FlowNodesModule } from './modules/flow-nodes/flow-nodes.module';
import { FlowOptionsModule } from './modules/flow-options/flow-options.module';
import { CustomerNotesModule } from './modules/customer-notes/customer-notes.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AutomationMainFlowModule } from './modules/automation-main-flow/automation-main-flow.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    BusinessesModule,
    UsersModule,
    BusinessSettingsModule,
    WhatsappSessionsModule,
    CustomersModule,
    ProductsModule,
    AppointmentsModule,
    MessagesModule,
    MessageInboxModule,
    FlowsModule,
    FlowNodesModule,
    FlowOptionsModule,
    AutomationMainFlowModule,
    CustomerNotesModule,
    PaymentsModule,
  ],
})
export class AppModule {}


