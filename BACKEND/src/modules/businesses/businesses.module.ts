import {
  Body,
  ConflictException,
  Controller,
  Get,
  Module,
  Param,
  Patch,
  Post,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import * as bcrypt from 'bcrypt';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import {
  AuthenticatedUser,
  requireBusinessId,
} from '../../auth/types/authenticated-user.type';
import { PrismaService } from '../../prisma/prisma.service';

class OnboardBusinessDto {
  @IsString()
  name!: string;

  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsString()
  ownerName!: string;

  @IsEmail()
  ownerEmail!: string;

  @IsString()
  @MinLength(6)
  ownerPassword!: string;

  @IsOptional()
  @IsString()
  ownerPhone?: string;
}

class UpdateBusinessDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

class CreateBusinessDto {
  @IsString()
  name!: string;

  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

class BusinessesService {
  constructor(private readonly prisma: PrismaService) {}

  async onboard(dto: OnboardBusinessDto) {
    const passwordHash = await bcrypt.hash(dto.ownerPassword, 10);

    return this.prisma.business.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        industry: dto.industry,
        timezone: dto.timezone,
        businessSettings: { create: {} },
        users: {
          create: {
            name: dto.ownerName,
            email: dto.ownerEmail,
            passwordHash,
            phone: dto.ownerPhone,
            role: 'owner',
          },
        },
      },
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true },
        },
        businessSettings: true,
      },
    });
  }

  async createForUser(user: AuthenticatedUser, dto: CreateBusinessDto) {
    if (user.businessId) {
      throw new ConflictException('User already has a business');
    }

    const business = await this.prisma.$transaction(async (tx) => {
      const createdBusiness = await tx.business.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          phone: dto.phone,
          email: dto.email,
          address: dto.address,
          industry: dto.industry,
          timezone: dto.timezone,
          businessSettings: { create: {} },
        },
      });

      await tx.user.update({
        where: { id: user.userId },
        data: {
          businessId: createdBusiness.id,
          role: 'owner',
        },
      });

      return createdBusiness;
    });

    return this.prisma.business.findUnique({
      where: { id: business.id },
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true },
        },
        businessSettings: true,
      },
    });
  }

  me(businessId: string) {
    return this.prisma.business.findUnique({
      where: { id: businessId },
      include: { businessSettings: true },
    });
  }

  update(businessId: string, dto: UpdateBusinessDto) {
    return this.prisma.business.update({
      where: { id: businessId },
      data: dto,
    });
  }
}

@Controller('businesses')
@UseGuards(JwtAuthGuard)
class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Public()
  @Post('onboard')
  onboard(@Body() dto: OnboardBusinessDto) {
    return this.businessesService.onboard(dto);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBusinessDto) {
    return this.businessesService.createForUser(user, dto);
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.businessesService.me(requireBusinessId(user));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateBusinessDto,
  ) {
    const businessId = requireBusinessId(user);

    if (id !== businessId || !['owner', 'admin'].includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.businessesService.update(id, dto);
  }
}

@Module({
  controllers: [BusinessesController],
  providers: [BusinessesService],
})
export class BusinessesModule {}
