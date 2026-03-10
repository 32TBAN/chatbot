import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const email = this.normalizeEmail(loginDto.email);

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { business: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.buildAuthResponse(user);
  }

  async register(registerDto: RegisterDto) {
    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          name: registerDto.name.trim(),
          phone: this.normalizePhone(registerDto.phone),
          email: this.normalizeEmail(registerDto.email),
          passwordHash,
          role: UserRole.owner,
          businessId: null,
        } satisfies Prisma.UserUncheckedCreateInput,
        include: { business: true },
      });

      return this.buildAuthResponse(user);
    } catch (error) {
      this.handleUniqueEmailError(error);
      throw error;
    }
  }

  private async buildAuthResponse(user: {
    id: string;
    businessId: string | null;
    name: string;
    email: string;
    role: string;
    business?: unknown | null;
  }) {
    const payload = {
      sub: user.id,
      userId: user.id,
      businessId: user.businessId,
      role: user.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        businessId: user.businessId,
        name: user.name,
        email: user.email,
        role: user.role,
        hasBusiness: Boolean(user.businessId),
        business: user.business ?? null,
      },
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { business: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      businessId: user.businessId,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      hasBusiness: Boolean(user.businessId),
      business: user.business,
    };
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private normalizePhone(phone?: string) {
    const value = phone?.trim();
    return value ? value : undefined;
  }

  private handleUniqueEmailError(error: unknown): void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      throw new ConflictException('Email already registered');
    }
  }
}
