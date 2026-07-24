import { BottleQuerySchema, permissionCode } from "@/lib/types";
import { requirePermission } from "@/lib/auth/session";
import { listBottleBalances, getBottleTotals } from "@/lib/bottles/queries";
import { listCustomerOptions } from "@/lib/customers/queries";
import { BottleSecurityView } from "@/components/bottles/bottle-security-view";

export default async function BottleSecurityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission(permissionCode("bottle_security", "VIEW"));
  const params = await searchParams;

  const parsed = BottleQuerySchema.safeParse({
    page: params.page,
    search: typeof params.search === "string" && params.search ? params.search : undefined,
  });
  const query = parsed.success ? parsed.data : BottleQuerySchema.parse({});

  const [data, totals, customers] = await Promise.all([
    listBottleBalances(user.companyId, query),
    getBottleTotals(user.companyId),
    listCustomerOptions(user.companyId),
  ]);

  return <BottleSecurityView data={data} query={query} totals={totals} customers={customers} />;
}
