import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, tap } from "rxjs";
import { Prisma } from "@x-pure/database";
import { PrismaService } from "../../prisma/prisma.service";
import { AUDITABLE_KEY } from "../decorators/auditable.decorator";
import type { AuthenticatedUser } from "../types/authenticated-user";

const SENSITIVE_FIELDS = new Set(["passwordHash", "tokenHash", "password"]);

function redact(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  const clone: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_FIELDS.has(key)) continue;
    clone[key] = val;
  }
  return clone;
}

/**
 * Opt-in via @Auditable(...) on specific high-value handlers — not a blanket Prisma
 * middleware, which would be noisy and risk logging sensitive fields by accident.
 * A failure here must never break the primary request, so write errors are swallowed.
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const action = this.reflector.get<string | undefined>(AUDITABLE_KEY, context.getHandler());
    if (!action) return next.handle();

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;

    return next.handle().pipe(
      tap((result) => {
        if (!user) return;
        const entity = result as Record<string, unknown> | undefined;
        const entityId = typeof entity?.id === "string" ? entity.id : undefined;

        this.prisma.client.auditLog
          .create({
            data: {
              companyId: user.companyId,
              userId: user.id,
              action,
              entityType: action.split("_")[0]?.toLowerCase() ?? "unknown",
              entityId,
              changes: redact(entity) as Prisma.InputJsonValue,
              ipAddress: request.ip,
              userAgent: request.headers["user-agent"],
            },
          })
          .catch(() => {
            /* audit logging must never break the primary request path */
          });
      }),
    );
  }
}
