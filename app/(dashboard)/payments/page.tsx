import { PaymentQuerySchema, permissionCode } from "@/lib/types";
import { requirePermission } from "@/lib/auth/session";
import { listPayments, listOpenOrderOptions } from "@/lib/payments/queries";
import { listCustomerOptions } from "@/lib/customers/queries";
import { PaymentsView } from "@/components/payments/payments-view";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission(permissionCode("payments", "VIEW"));
  const params = await searchParams;

  const parsed = PaymentQuerySchema.safeParse({
    page: params.page,
    search: typeof params.search === "string" && params.search ? params.search : undefined,
    method: params.method,
    status: params.status,
  });
  const query = parsed.success ? parsed.data : PaymentQuerySchema.parse({});

  const [data, customers, openOrders] = await Promise.all([
    listPayments(user.companyId, query),
    listCustomerOptions(user.companyId),
    listOpenOrderOptions(user.companyId),
  ]);

  return <PaymentsView data={data} query={query} customers={customers} openOrders={openOrders} />;
}
