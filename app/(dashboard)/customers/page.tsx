import { CustomerQuerySchema, permissionCode } from "@/lib/types";
import { requirePermission } from "@/lib/auth/session";
import { listCustomers } from "@/lib/customers/queries";
import { CustomersView } from "@/components/customers/customers-view";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission(permissionCode("customers", "VIEW"));
  const params = await searchParams;

  const parsed = CustomerQuerySchema.safeParse({
    page: params.page,
    search: typeof params.search === "string" && params.search ? params.search : undefined,
    customerType: params.customerType,
    status: params.status,
  });
  const query = parsed.success ? parsed.data : CustomerQuerySchema.parse({});

  const data = await listCustomers(user.companyId, query);

  return <CustomersView data={data} query={query} />;
}
