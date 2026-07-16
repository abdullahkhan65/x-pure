import { SetMetadata } from "@nestjs/common";

export const PERMISSION_KEY = "requiredPermission";

/** e.g. @RequirePermission("customers.view") — checked by the global PermissionsGuard. */
export const RequirePermission = (code: string) => SetMetadata(PERMISSION_KEY, code);
