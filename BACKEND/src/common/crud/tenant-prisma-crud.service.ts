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

  protected requireBusinessId(businessId: string | null): string {
    if (!businessId) {
      throw new ForbiddenException('Business setup required');
    }

    return businessId;
  }

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

  protected async findAll(config: TenantConfig, businessId: string | null) {
    const scopedBusinessId = this.requireBusinessId(businessId);

    return this.delegate(config.model).findMany({
      where: config.tenantField
        ? this.applyTenantScope({}, scopedBusinessId, config.tenantField)
        : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  protected async findOne(config: TenantConfig, id: string, businessId: string | null) {
    const scopedBusinessId = this.requireBusinessId(businessId);

    const record = await this.delegate(config.model).findFirst({
      where: config.tenantField
        ? this.applyTenantScope({ id }, scopedBusinessId, config.tenantField)
        : { id },
    });

    if (!record) {
      throw new NotFoundException('Resource not found');
    }

    return record;
  }

  protected async create(
    config: TenantConfig,
    businessId: string | null,
    data: Record<string, unknown>,
  ) {
    const scopedBusinessId = this.requireBusinessId(businessId);

    try {
      return await this.delegate(config.model).create({
        data: config.tenantField ? { ...data, [config.tenantField]: scopedBusinessId } : data,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  protected async update(
    config: TenantConfig,
    id: string,
    businessId: string | null,
    data: Record<string, unknown>,
  ) {
    const scopedBusinessId = this.requireBusinessId(businessId);
    const existing = await this.findOne(config, id, scopedBusinessId);
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

  protected async remove(config: TenantConfig, id: string, businessId: string | null) {
    const scopedBusinessId = this.requireBusinessId(businessId);
    await this.findOne(config, id, scopedBusinessId);
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
