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

class CreateCustomerNoteDto {
  @IsString()
  customerId!: string;

  @IsString()
  content!: string;
}

class UpdateCustomerNoteDto {
  @IsOptional()
  @IsString()
  content?: string;
}

class CustomerNotesService {
  constructor(private readonly prisma: PrismaService) {}

  list(user: AuthenticatedUser) {
    return this.prisma.customerNote.findMany({
      where: { customer: { businessId: user.businessId } },
      include: { customer: true, user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(user: AuthenticatedUser, id: string) {
    const note = await this.prisma.customerNote.findFirst({
      where: { id, customer: { businessId: user.businessId } },
      include: { customer: true, user: true },
    });

    if (!note) {
      throw new NotFoundException('Resource not found');
    }

    return note;
  }

  async create(user: AuthenticatedUser, dto: CreateCustomerNoteDto) {
    await this.prisma.customer.findFirstOrThrow({
      where: { id: dto.customerId, businessId: user.businessId },
    });

    return this.prisma.customerNote.create({
      data: {
        customerId: dto.customerId,
        userId: user.userId,
        content: dto.content,
      },
    });
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateCustomerNoteDto) {
    await this.get(user, id);
    return this.prisma.customerNote.update({
      where: { id },
      data: dto,
    });
  }

  async remove(user: AuthenticatedUser, id: string) {
    await this.get(user, id);
    return this.prisma.customerNote.delete({ where: { id } });
  }
}

@Controller('customer-notes')
@UseGuards(JwtAuthGuard)
class CustomerNotesController {
  constructor(private readonly customerNotesService: CustomerNotesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.customerNotesService.list(user);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.customerNotesService.get(user, id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCustomerNoteDto) {
    return this.customerNotesService.create(user, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerNoteDto,
  ) {
    return this.customerNotesService.update(user, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.customerNotesService.remove(user, id);
  }
}

@Module({
  controllers: [CustomerNotesController],
  providers: [CustomerNotesService],
})
export class CustomerNotesModule {}
