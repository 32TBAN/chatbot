import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type TenantConfig = {
  model: string;
  tenantField?: string;
};

@Injectable()
export class TenantPrismaCrudService {
  constructor(protected readonly prisma: PrismaService) {}

  protected delegate(model: string): any {
    return (this.prisma as any)[model];
  }

  protected applyTenantScope(
    where: Record<string, unknown>,
    businessId: string,
    tenantField = 'businessId',
  ) {
    return {
      ...where,
      [tenantField]: businessId,
    };
  }

  protected async findAll(config: TenantConfig, businessId: string) {
    return this.delegate(config.model).findMany({
      where: config.tenantField
        ? this.applyTenantScope({}, businessId, config.tenantField)
        : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  protected async findOne(config: TenantConfig, id: string, businessId: string) {
    const record = await this.delegate(config.model).findFirst({
      where: config.tenantField
        ? this.applyTenantScope({ id }, businessId, config.tenantField)
        : { id },
    });

    if (!record) {
      throw new NotFoundException('Resource not found');
    }

    return record;
  }

  protected async create(
    config: TenantConfig,
    businessId: string,
    data: Record<string, unknown>,
  ) {
    try {
      return await this.delegate(config.model).create({
        data: config.tenantField ? { ...data, [config.tenantField]: businessId } : data,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  protected async update(
    config: TenantConfig,
    id: string,
    businessId: string,
    data: Record<string, unknown>,
  ) {
    const existing = await this.findOne(config, id, businessId);
    const tenantData = config.tenantField
      ? { ...data, [config.tenantField]: (existing as Record<string, unknown>)[config.tenantField] }
      : data;

    try {
      return await this.delegate(config.model).update({
        where: { id },
        data: tenantData,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  protected async remove(config: TenantConfig, id: string, businessId: string) {
    await this.findOne(config, id, businessId);
    return this.delegate(config.model).delete({ where: { id } });
  }

  protected forbidIfRole(role: string, allowedRoles: string[]) {
    if (!allowedRoles.includes(role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  protected handlePrismaError(error: unknown): never {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      throw new ConflictException('Unique constraint violation');
    }

    throw error;
  }
}
