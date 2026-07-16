import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

interface CacheEntry {
  codes: Set<string>;
  expiresAt: number;
}

const CACHE_TTL_MS = 60_000;

/**
 * roleId -> permission codes, backed by a direct indexed Postgres lookup. At 8 roles /
 * ~50 permissions for one tenant, Redis caching here would be premature — this short
 * in-process cache just dedupes bursts, it's not a correctness mechanism.
 */
@Injectable()
export class RbacService {
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly prisma: PrismaService) {}

  async getPermissionCodes(roleId: string): Promise<Set<string>> {
    const cached = this.cache.get(roleId);
    if (cached && cached.expiresAt > Date.now()) return cached.codes;

    const rolePermissions = await this.prisma.client.rolePermission.findMany({
      where: { roleId },
      select: { permission: { select: { code: true } } },
    });
    const codes = new Set(rolePermissions.map((rp) => rp.permission.code));
    this.cache.set(roleId, { codes, expiresAt: Date.now() + CACHE_TTL_MS });
    return codes;
  }

  invalidate(roleId: string) {
    this.cache.delete(roleId);
  }
}
