import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient, SOFT_DELETE_MODELS, TENANT_SCOPED_MODELS } from "@x-pure/database";

const TENANT_SCOPED_SET = new Set<string>(TENANT_SCOPED_MODELS);
const SOFT_DELETE_SET = new Set<string>(SOFT_DELETE_MODELS);

const CREATE_OPS = new Set(["create", "createMany"]);
const WHERE_OPS = new Set([
  "findMany",
  "findFirst",
  "findFirstOrThrow",
  "findUnique",
  "findUniqueOrThrow",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
  "count",
  "aggregate",
  "groupBy",
]);
const READ_LIST_OPS = new Set(["findMany", "findFirst", "findFirstOrThrow", "count"]);

/** companyId must be a direct key — this is for write payloads, which are always flat. */
function hasFlatCompanyId(value: unknown): boolean {
  return typeof value === "object" && value !== null && "companyId" in value;
}

/**
 * companyId must be present either as a direct where key, or nested one level down inside
 * a compound-unique-key object (Prisma represents `@@unique([companyId, code])` lookups as
 * `where: { companyId_code: { companyId, code } }` — a real shape used throughout this
 * schema, e.g. Counter's `companyId_key`, Customer's `companyId_customerCode`).
 */
function hasCompanyIdSomewhere(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  if ("companyId" in obj) return true;
  return Object.values(obj).some(
    (nested) => typeof nested === "object" && nested !== null && "companyId" in nested,
  );
}

function assertDataScoped(model: string, operation: string, rawData: unknown) {
  const items = Array.isArray(rawData) ? rawData : [rawData];
  for (const item of items) {
    if (!hasFlatCompanyId(item)) {
      throw new Error(
        `[TenantGuard] ${model}.${operation} is missing companyId in data — refusing to run an unscoped write.`,
      );
    }
  }
}

function assertWhereScoped(model: string, operation: string, where: unknown) {
  if (!hasCompanyIdSomewhere(where)) {
    throw new Error(
      `[TenantGuard] ${model}.${operation} is missing companyId in where — refusing to run an unscoped query.`,
    );
  }
}

/**
 * Tenant isolation is enforced explicitly in services (they always pass companyId), and this
 * extension is the fail-loud safety net: it throws instead of silently running an unscoped
 * query if companyId is ever missing. Deliberately not auto-injecting companyId — that would
 * risk silently widening a query if the injection logic itself had a bug.
 */
function assertTenantScoped(model: string, operation: string, args: Record<string, unknown>) {
  if (CREATE_OPS.has(operation)) {
    assertDataScoped(model, operation, args.data);
    return;
  }

  if (operation === "upsert") {
    assertWhereScoped(model, operation, args.where);
    assertDataScoped(model, operation, args.create);
    return;
  }

  if (WHERE_OPS.has(operation)) {
    assertWhereScoped(model, operation, args.where);
  }
}

/** Reads default to excluding soft-deleted rows unless the caller's where already specifies deletedAt. */
function applySoftDeleteFilter(operation: string, args: Record<string, unknown>): Record<string, unknown> {
  if (!READ_LIST_OPS.has(operation)) return args;
  const where = (args.where ?? {}) as Record<string, unknown>;
  if ("deletedAt" in where) return args;
  return { ...args, where: { ...where, deletedAt: null } };
}

function createGuardedClient() {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  return base.$extends({
    name: "tenant-and-soft-delete-guard",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const typedArgs = args as Record<string, unknown>;
          if (model && TENANT_SCOPED_SET.has(model)) {
            assertTenantScoped(model, operation, typedArgs);
          }
          const nextArgs =
            model && SOFT_DELETE_SET.has(model) ? applySoftDeleteFilter(operation, typedArgs) : typedArgs;
          return query(nextArgs);
        },
      },
    },
  });
}

export type GuardedPrismaClient = ReturnType<typeof createGuardedClient>;

/**
 * NestJS DI wants an injectable class; Prisma Client Extensions return a new proxied
 * object rather than mutating a subclass instance — so this wraps the extended client
 * via composition instead of `class PrismaService extends PrismaClient`. Access the
 * extended client through `prisma.client` (e.g. `this.prisma.client.customer.findMany(...)`).
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  readonly client: GuardedPrismaClient = createGuardedClient();

  async onModuleInit() {
    await this.client.$connect();
    this.logger.log("Connected to Postgres");
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
