import {
  Body,
  Controller,
  Delete,
  Get,
  Module,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import * as bcrypt from 'bcrypt';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { TenantPrismaCrudService } from '../../common/crud/tenant-prisma-crud.service';
import { PrismaService } from '../../prisma/prisma.service';

class CreateUserDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  role!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class UsersService extends TenantPrismaCrudService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  list(user: AuthenticatedUser) {
    this.forbidIfRole(user.role, ['owner', 'admin']);
    return this.findAll({ model: 'user', tenantField: 'businessId' }, user.businessId);
  }

  get(user: AuthenticatedUser, id: string) {
    this.forbidIfRole(user.role, ['owner', 'admin']);
    return this.findOne({ model: 'user', tenantField: 'businessId' }, id, user.businessId);
  }

  async createUser(user: AuthenticatedUser, dto: CreateUserDto) {
    this.forbidIfRole(user.role, ['owner', 'admin']);
    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.create(
      { model: 'user', tenantField: 'businessId' },
      user.businessId,
      {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        passwordHash,
        role: dto.role,
        isActive: dto.isActive,
      },
    );
  }

  async updateUser(user: AuthenticatedUser, id: string, dto: UpdateUserDto) {
    this.forbidIfRole(user.role, ['owner', 'admin']);
    const data: Record<string, unknown> = {
      name: dto.name,
      phone: dto.phone,
      email: dto.email,
      role: dto.role,
      isActive: dto.isActive,
    };

    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    return this.update(
      { model: 'user', tenantField: 'businessId' },
      id,
      user.businessId,
      data,
    );
  }

  deleteUser(user: AuthenticatedUser, id: string) {
    this.forbidIfRole(user.role, ['owner', 'admin']);
    return this.remove({ model: 'user', tenantField: 'businessId' }, id, user.businessId);
  }
}

@Controller('users')
@UseGuards(JwtAuthGuard)
class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.list(user);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.usersService.get(user, id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateUserDto) {
    return this.usersService.createUser(user, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(user, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.usersService.deleteUser(user, id);
  }
}

@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
