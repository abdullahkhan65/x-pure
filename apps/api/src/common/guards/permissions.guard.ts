import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSION_KEY } from "../decorators/require-permission.decorator";
import { RbacService } from "../../modules/rbac/rbac.service";
import type { AuthenticatedUser } from "../types/authenticated-user";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredCode = this.reflector.getAllAndOverride<string | undefined>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredCode) return true; // authentication alone gates routes with no explicit permission

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;
    if (!user) return false;

    const codes = await this.rbacService.getPermissionCodes(user.roleId);
    if (!codes.has(requiredCode)) {
      throw new ForbiddenException(`Missing permission: ${requiredCode}`);
    }
    return true;
  }
}
