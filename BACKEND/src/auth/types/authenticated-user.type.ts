import { ForbiddenException } from '@nestjs/common';

export type AuthenticatedUser = {
  userId: string;
  businessId: string | null;
  role: string;
};

export function requireBusinessId(user: AuthenticatedUser): string {
  if (!user.businessId) {
    throw new ForbiddenException('Business setup required');
  }

  return user.businessId;
}
