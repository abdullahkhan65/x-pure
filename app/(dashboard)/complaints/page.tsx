import { ComplaintQuerySchema, permissionCode } from "@/lib/types";
import { requirePermission } from "@/lib/auth/session";
import { listComplaints } from "@/lib/complaints/queries";
import { listCustomerOptions } from "@/lib/customers/queries";
import { listStaffOptions } from "@/lib/employees/queries";
import { ComplaintsView } from "@/components/complaints/complaints-view";

export default async function ComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission(permissionCode("complaints", "VIEW"));
  const params = await searchParams;

  const parsed = ComplaintQuerySchema.safeParse({
    page: params.page,
    search: typeof params.search === "string" && params.search ? params.search : undefined,
    status: params.status,
    priority: params.priority,
  });
  const query = parsed.success ? parsed.data : ComplaintQuerySchema.parse({});

  const [data, customers, staff] = await Promise.all([
    listComplaints(user.companyId, query),
    listCustomerOptions(user.companyId),
    listStaffOptions(user.companyId),
  ]);

  return <ComplaintsView data={data} query={query} customers={customers} staff={staff} />;
}
