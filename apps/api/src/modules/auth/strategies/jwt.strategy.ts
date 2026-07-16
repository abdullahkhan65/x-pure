import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import type { Env } from "../../../config/env.schema";
import type { AuthenticatedUser } from "../../../common/types/authenticated-user";

interface AccessTokenPayload {
  sub: string;
  companyId: string;
  branchId: string | null;
  roleId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService<Env, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get("JWT_ACCESS_SECRET", { infer: true }),
      ignoreExpiration: false,
    });
  }

  validate(payload: AccessTokenPayload): AuthenticatedUser {
    return {
      id: payload.sub,
      companyId: payload.companyId,
      branchId: payload.branchId,
      roleId: payload.roleId,
    };
  }
}
