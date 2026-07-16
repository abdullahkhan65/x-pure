import { SetMetadata } from "@nestjs/common";

export const AUDITABLE_KEY = "auditableAction";

/** e.g. @Auditable("CUSTOMER_CREATED") — captured by AuditLogInterceptor after the handler succeeds. */
export const Auditable = (action: string) => SetMetadata(AUDITABLE_KEY, action);
