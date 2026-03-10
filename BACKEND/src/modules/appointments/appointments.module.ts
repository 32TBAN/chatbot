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
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import {
  AuthenticatedUser,
  requireBusinessId,
} from '../../auth/types/authenticated-user.type';
import { PrismaService } from '../../prisma/prisma.service';

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
}

class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

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
    });
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateAppointmentDto) {
    const businessId = requireBusinessId(user);
    await this.get(businessId, id);

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

    return this.prisma.appointment.update({
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
    });
  }

  async remove(user: AuthenticatedUser, id: string) {
    await this.get(requireBusinessId(user), id);
    return this.prisma.appointment.delete({ where: { id } });
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
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}
