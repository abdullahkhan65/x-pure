import type { Prisma, Product } from "@prisma/client";
import { db } from "@/lib/db";
import type { ProductQuery, ProductResponse } from "@/lib/types";

export interface PaginatedProducts {
  items: ProductResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const SORTABLE_FIELDS = new Set(["createdAt", "name", "sku", "unitPrice"]);

export async function listProducts(companyId: string, query: ProductQuery): Promise<PaginatedProducts> {
  const where: Prisma.ProductWhereInput = {
    companyId,
    ...(query.unit ? { unit: query.unit } : {}),
    ...(query.isActive ? { isActive: query.isActive === "true" } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { sku: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const sortField = query.sortBy && SORTABLE_FIELDS.has(query.sortBy) ? query.sortBy : "createdAt";
  const orderBy = { [sortField]: query.sortOrder } as Prisma.ProductOrderByWithRelationInput;

  const [items, total] = await Promise.all([
    db.product.findMany({ where, orderBy, skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
    db.product.count({ where }),
  ]);

  return {
    items: items.map(toResponse),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(Math.ceil(total / query.pageSize), 1),
  };
}

/** Active products, lightweight — for order line-item selectors. */
export async function listActiveProducts(companyId: string): Promise<ProductResponse[]> {
  const products = await db.product.findMany({
    where: { companyId, isActive: true },
    orderBy: { name: "asc" },
  });
  return products.map(toResponse);
}

export function toResponse(product: Product): ProductResponse {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    unit: product.unit,
    unitPrice: Number(product.unitPrice),
    depositAmount: product.depositAmount === null ? null : Number(product.depositAmount),
    isReturnable: product.isReturnable,
    isActive: product.isActive,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}
