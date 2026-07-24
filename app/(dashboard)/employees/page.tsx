import { EmployeeQuerySchema, permissionCode } from "@/lib/types";
import { requirePermission } from "@/lib/auth/session";
import { listEmployees, listRoleOptions } from "@/lib/employees/queries";
import { listBranchOptions } from "@/lib/branches";
import { EmployeesView } from "@/components/employees/employees-view";

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission(permissionCode("employees", "VIEW"));
  const params = await searchParams;

  const parsed = EmployeeQuerySchema.safeParse({
    page: params.page,
    search: typeof params.search === "string" && params.search ? params.search : undefined,
    roleId: params.roleId,
    status: params.status,
  });
  const query = parsed.success ? parsed.data : EmployeeQuerySchema.parse({});

  const [data, roles, branches] = await Promise.all([
    listEmployees(user.companyId, query),
    listRoleOptions(user.companyId),
    listBranchOptions(user.companyId),
  ]);

  return <EmployeesView data={data} query={query} roles={roles} branches={branches} />;
}
