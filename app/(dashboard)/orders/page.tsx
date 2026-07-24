import { OrderQuerySchema, permissionCode } from "@/lib/types";
import { requirePermission } from "@/lib/auth/session";
import { listOrders } from "@/lib/orders/queries";
import { OrdersView } from "@/components/orders/orders-view";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission(permissionCode("orders", "VIEW"));
  const params = await searchParams;

  const parsed = OrderQuerySchema.safeParse({
    page: params.page,
    search: typeof params.search === "string" && params.search ? params.search : undefined,
    status: params.status,
    paymentStatus: params.paymentStatus,
    customerId: params.customerId,
  });
  const query = parsed.success ? parsed.data : OrderQuerySchema.parse({});

  const data = await listOrders(user.companyId, query);

  return <OrdersView data={data} query={query} />;
}
