import { ProductQuerySchema, permissionCode } from "@/lib/types";
import { requirePermission } from "@/lib/auth/session";
import { listProducts } from "@/lib/products/queries";
import { ProductsView } from "@/components/products/products-view";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission(permissionCode("products", "VIEW"));
  const params = await searchParams;

  const parsed = ProductQuerySchema.safeParse({
    page: params.page,
    search: typeof params.search === "string" && params.search ? params.search : undefined,
    unit: params.unit,
    isActive: params.isActive,
  });
  const query = parsed.success ? parsed.data : ProductQuerySchema.parse({});

  const data = await listProducts(user.companyId, query);

  return <ProductsView data={data} query={query} />;
}
