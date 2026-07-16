/**
 * Prisma model names that carry a required companyId. Consumed by the API's
 * tenant-guard Prisma Client Extension — any query against these models missing
 * companyId in where/data throws instead of silently running unscoped.
 */
export const TENANT_SCOPED_MODELS = [
  "User",
  "Customer",
  "Order",
  "Product",
  "DeliveryRoute",
  "BottleLedgerEntry",
  "DepositLedgerEntry",
  "Payment",
  "Complaint",
  "Role",
  "AuditLog",
  "Counter",
] as const;

export type TenantScopedModel = (typeof TENANT_SCOPED_MODELS)[number];

/** Models with a deletedAt column — reads are auto-filtered to deletedAt: null. */
export const SOFT_DELETE_MODELS = ["Customer"] as const;

export type SoftDeleteModel = (typeof SOFT_DELETE_MODELS)[number];
