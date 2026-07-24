import { RouteQuerySchema, permissionCode } from "@/lib/types";
import { requirePermission } from "@/lib/auth/session";
import { listRoutes } from "@/lib/routes/queries";
import { listBranchOptions } from "@/lib/branches";
import { RoutesView } from "@/components/routes/routes-view";

export default async function RoutesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission(permissionCode("routes", "VIEW"));
  const params = await searchParams;

  const parsed = RouteQuerySchema.safeParse({
    page: params.page,
    search: typeof params.search === "string" && params.search ? params.search : undefined,
    isActive: params.isActive,
  });
  const query = parsed.success ? parsed.data : RouteQuerySchema.parse({});

  const [data, branches] = await Promise.all([listRoutes(user.companyId, query), listBranchOptions(user.companyId)]);

  return <RoutesView data={data} query={query} branches={branches} />;
}
