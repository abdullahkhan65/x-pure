import { ProductQuerySchema, permissionCode } from "@/lib/types";
import { requirePermission } from "@/lib/auth/session";
import { listInventory, getInventorySummary } from "@/lib/inventory/queries";
import { InventoryView } from "@/components/inventory/inventory-view";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission(permissionCode("inventory", "VIEW"));
  const params = await searchParams;

  const parsed = ProductQuerySchema.safeParse({
    page: params.page,
    search: typeof params.search === "string" && params.search ? params.search : undefined,
    isActive: params.isActive,
  });
  const query = parsed.success ? parsed.data : ProductQuerySchema.parse({});

  const [data, summary] = await Promise.all([listInventory(user.companyId, query), getInventorySummary(user.companyId)]);

  return <InventoryView data={data} query={query} summary={summary} />;
}
