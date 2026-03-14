import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsInt, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import {
  AuthenticatedUser,
  requireBusinessId,
} from '../../auth/types/authenticated-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsappRuntimeService } from '../whatsapp-sessions/whatsapp-runtime.service';
import { WhatsappSessionsModule } from '../whatsapp-sessions/whatsapp-sessions.module';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

class CreateAppointmentDto {
  @IsString()
  customerId!: string;

  @IsOptional()
  @IsString()
  assignedUserId?: string;

  @IsDateString()
  appointmentDate!: string;

  @IsString()
  appointmentTime!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

class UpdateAppointmentDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  assignedUserId?: string;

  @IsOptional()
  @IsDateString()
  appointmentDate?: string;

  @IsOptional()
  @IsString()
  appointmentTime?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  notifyCustomer?: boolean;
}

@Injectable()
class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappRuntime: WhatsappRuntimeService,
  ) {}

  list(businessId: string) {
    return this.prisma.appointment.findMany({
      where: { businessId },
      include: { customer: true, assignedUser: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(businessId: string, id: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, businessId },
      include: { customer: true, assignedUser: true },
    });

    if (!appointment) {
      throw new NotFoundException('Resource not found');
    }

    return appointment;
  }

  async create(user: AuthenticatedUser, dto: CreateAppointmentDto) {
    const businessId = requireBusinessId(user);

    await this.prisma.customer.findFirstOrThrow({
      where: { id: dto.customerId, businessId },
    });

    if (dto.assignedUserId) {
      await this.prisma.user.findFirstOrThrow({
        where: { id: dto.assignedUserId, businessId },
      });
    }

    return this.prisma.appointment.create({
      data: {
        businessId,
        customerId: dto.customerId,
        assignedUserId: dto.assignedUserId,
        appointmentDate: new Date(dto.appointmentDate),
        appointmentTime: new Date(`1970-01-01T${dto.appointmentTime}`),
        durationMinutes: dto.durationMinutes,
        description: dto.description,
        status: dto.status as any,
      },
      include: { customer: true, assignedUser: true },
    });
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateAppointmentDto) {
    const businessId = requireBusinessId(user);
    const current = await this.get(businessId, id);

    if (dto.customerId) {
      await this.prisma.customer.findFirstOrThrow({
        where: { id: dto.customerId, businessId },
      });
    }

    if (dto.assignedUserId) {
      await this.prisma.user.findFirstOrThrow({
        where: { id: dto.assignedUserId, businessId },
      });
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        customerId: dto.customerId,
        assignedUserId: dto.assignedUserId,
        appointmentDate: dto.appointmentDate ? new Date(dto.appointmentDate) : undefined,
        appointmentTime: dto.appointmentTime
          ? new Date(`1970-01-01T${dto.appointmentTime}`)
          : undefined,
        durationMinutes: dto.durationMinutes,
        description: dto.description,
        status: dto.status as any,
      },
      include: { customer: true, assignedUser: true },
    });

    const statusChanged = Boolean(dto.status && dto.status !== current.status);
    if (dto.notifyCustomer && statusChanged) {
      await this.notifyCustomerStatusChange(updated.businessId, updated.id);
    }

    return updated;
  }

  async remove(user: AuthenticatedUser, id: string) {
    await this.get(requireBusinessId(user), id);
    return this.prisma.appointment.delete({ where: { id } });
  }

  private async notifyCustomerStatusChange(businessId: string, appointmentId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, businessId },
      include: {
        customer: true,
        business: {
          select: {
            name: true,
            businessSettings: {
              select: {
                locationLabel: true,
                locationAddress: true,
                locationGoogleMapsUrl: true,
              },
            },
          },
        },
      },
    });

    if (!appointment?.customer?.phone) {
      throw new BadRequestException('La cita no tiene un cliente con telefono para notificar.');
    }

    const actions = await this.buildStatusActions(appointment);
    if (!actions.length) {
      return;
    }

    const tempPaths = actions.flatMap((action) => (
      action.type === 'media' && action.mediaKind === 'document' ? [action.mediaPath] : []
    ));

    try {
      await this.whatsappRuntime.sendActionsToCustomer({
        businessId,
        customerId: appointment.customerId,
        phone: appointment.customer.phone,
        actions,
      });
    } finally {
      await Promise.all(tempPaths.map(async (filePath) => {
        try {
          await fs.unlink(filePath);
        } catch {
          return;
        }
      }));
    }
  }

  private async buildStatusActions(appointment: any) {
    if (!appointment) {
      return [];
    }

    const date = this.formatDate(appointment.appointmentDate);
    const time = this.formatTime(appointment.appointmentTime);
    const businessName = appointment.business?.name?.trim() || 'nuestro negocio';
    const locationLabel = appointment.business?.businessSettings?.locationLabel?.trim()
      || appointment.business?.businessSettings?.locationAddress?.trim()
      || businessName;

    if (appointment.status === 'confirmed') {
      const icsPath = await this.createAppointmentIcs({
        summary: appointment.description?.trim() || `Cita en ${businessName}`,
        date,
        time,
        location: locationLabel,
        description: appointment.description?.trim() || `Cita confirmada en ${businessName}`,
      });

      return [
        {
          type: 'text' as const,
          content: `Tu cita ha sido confirmada. Te esperaremos el dia ${date} a las ${time}. Por favor asiste puntual y guarda este evento en tu calendario.`,
        },
        {
          type: 'media' as const,
          mediaKind: 'document' as const,
          mediaPath: icsPath,
          caption: 'Adjuntamos el evento para que puedas guardarlo en el calendario de tu telefono.',
        },
      ];
    }

    if (appointment.status === 'cancelled') {
      return [{
        type: 'text' as const,
        content: 'Tu cita ha sido cancelada por inconsistencias. Por favor acercate a nuestras sucursales o contacta con soporte para ayudarte.',
      }];
    }

    if (appointment.status === 'completed') {
      return [{
        type: 'text' as const,
        content: 'Gracias por agendar una cita con nosotros. Ã‚Â¿Que te parecio el servicio?',
      }];
    }

    return [];
  }

  private formatDate(value: Date) {
    return value.toISOString().slice(0, 10);
  }

  private formatTime(value: Date) {
    return value.toISOString().slice(11, 16);
  }

  private incrementHour(time: string) {
    const [hour, minute] = time.split(':').map((part) => Number(part));
    const nextHour = (hour + 1).toString().padStart(2, '0');
    return `${nextHour}:${String(minute).padStart(2, '0')}`;
  }

  private formatIcsDateTime(date: string, time: string) {
    return `${date.replace(/-/g, '')}T${time.replace(':', '')}00`;
  }

  private async createAppointmentIcs(input: {
    summary: string;
    date: string;
    time: string;
    location: string;
    description: string;
  }) {
    const content = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${input.summary}\nDTSTART:${this.formatIcsDateTime(input.date, input.time)}\nDTEND:${this.formatIcsDateTime(input.date, this.incrementHour(input.time))}\nLOCATION:${input.location}\nDESCRIPTION:${input.description}\nEND:VEVENT\nEND:VCALENDAR`;
    const filePath = path.join(os.tmpdir(), `appointment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.ics`);
    await fs.writeFile(filePath, content, 'utf8');
    return filePath;
  }
}

@Controller('appointments')
@UseGuards(JwtAuthGuard)
class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.appointmentsService.list(requireBusinessId(user));
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.appointmentsService.get(requireBusinessId(user), id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(user, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(user, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.appointmentsService.remove(user, id);
  }
}

@Module({
  imports: [WhatsappSessionsModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}