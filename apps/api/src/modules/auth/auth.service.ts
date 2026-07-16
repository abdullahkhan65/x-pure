import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { verify } from "@node-rs/argon2";
import { createHash, randomBytes } from "node:crypto";
import type { CurrentUser } from "@x-pure/types";
import { Prisma } from "@x-pure/database";
import { PrismaService } from "../../prisma/prisma.service";
import { RbacService } from "../rbac/rbac.service";
import type { Env } from "../../config/env.schema";

type UserWithRole = Prisma.UserGetPayload<{ include: { role: true } }>;

interface RequestMeta {
  userAgent?: string;
  ip?: string;
}

interface AuthResult {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
  user: CurrentUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<Env, true>,
    private readonly rbacService: RbacService,
  ) {}

  async login(email: string, password: string, meta: RequestMeta): Promise<AuthResult> {
    // Single company exists today; a real multi-tenant login would resolve companyId
    // from the request (subdomain/slug) instead of grabbing "the" company.
    const company = await this.prisma.client.company.findFirstOrThrow();

    const user = await this.prisma.client.user.findFirst({
      where: { companyId: company.id, email },
      include: { role: true },
    });

    if (!user || user.status !== "ACTIVE") {
      throw new UnauthorizedException("Invalid email or password");
    }

    const passwordValid = await verify(user.passwordHash, password);
    if (!passwordValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    await this.prisma.client.user.update({
      where: { companyId: user.companyId, id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = await this.issueAccessToken(user);
    const refresh = await this.issueRefreshToken(user.id, meta);
    const currentUser = await this.toCurrentUser(user);

    return { accessToken, refreshToken: refresh.raw, refreshExpiresAt: refresh.expiresAt, user: currentUser };
  }

  async refresh(rawToken: string | undefined, meta: RequestMeta): Promise<AuthResult> {
    if (!rawToken) throw new UnauthorizedException("Missing refresh token");

    const tokenHash = this.hashToken(rawToken);
    const record = await this.prisma.client.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { role: true } } },
    });

    if (!record) throw new UnauthorizedException("Invalid refresh token");

    if (record.revokedAt) {
      // A revoked token being presented again means it was stolen/replayed — burn the
      // whole session family rather than trusting the presenter.
      await this.prisma.client.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException("Refresh token reuse detected; all sessions revoked");
    }

    if (record.expiresAt < new Date()) {
      throw new UnauthorizedException("Refresh token expired");
    }

    const newRefresh = await this.issueRefreshToken(record.userId, meta);
    await this.prisma.client.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date(), replacedBy: newRefresh.id },
    });

    const accessToken = await this.issueAccessToken(record.user);
    const currentUser = await this.toCurrentUser(record.user);

    return {
      accessToken,
      refreshToken: newRefresh.raw,
      refreshExpiresAt: newRefresh.expiresAt,
      user: currentUser,
    };
  }

  async logout(rawToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawToken);
    await this.prisma.client.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueAccessToken(user: Pick<UserWithRole, "id" | "companyId" | "branchId" | "roleId">) {
    return this.jwtService.signAsync({
      sub: user.id,
      companyId: user.companyId,
      branchId: user.branchId,
      roleId: user.roleId,
    });
  }

  private async issueRefreshToken(userId: string, meta: RequestMeta) {
    const raw = randomBytes(48).toString("hex");
    const tokenHash = this.hashToken(raw);
    const ttlDays = this.configService.get("JWT_REFRESH_TTL_DAYS", { infer: true });
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    const record = await this.prisma.client.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        userAgent: meta.userAgent,
        ipAddress: meta.ip,
      },
    });

    return { id: record.id, raw, expiresAt };
  }

  private hashToken(raw: string): string {
    return createHash("sha256").update(raw).digest("hex");
  }

  private async toCurrentUser(user: UserWithRole): Promise<CurrentUser> {
    const codes = await this.rbacService.getPermissionCodes(user.roleId);
    return {
      id: user.id,
      companyId: user.companyId,
      branchId: user.branchId,
      roleId: user.roleId,
      roleName: user.role.name,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      permissions: Array.from(codes),
    };
  }
}
