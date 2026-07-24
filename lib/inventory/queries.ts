import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { ProductQuery } from "@/lib/types";
import { getBottleTotals } from "@/lib/bottles/queries";

export interface InventoryRow {
  id: string;
  sku: string;
  name: string;
  unit: string;
  unitPrice: number;
  isReturnable: boolean;
  isActive: boolean;
  unitsSold: number;
  revenue: number;
}

export interface InventorySummary {
  totalSkus: number;
  activeSkus: number;
  bottlesInCirculation: number;
}

export interface PaginatedInventory {
  items: InventoryRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Read-only view: the schema has no stock-level table, so "inventory" here is the product
 * catalog enriched with sales pulled from order items (delivered/active orders only).
 */
export async function listInventory(companyId: string, query: ProductQuery): Promise<PaginatedInventory> {
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

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    db.product.count({ where }),
  ]);

  const ids = products.map((p) => p.id);
  const sales = ids.length
    ? await db.orderItem.groupBy({
        by: ["productId"],
        where: { productId: { in: ids }, order: { companyId, status: { not: "CANCELLED" } } },
        _sum: { quantity: true, lineTotal: true },
      })
    : [];
  const salesById = new Map(sales.map((s) => [s.productId, s]));

  return {
    items: products.map((product) => {
      const sale = salesById.get(product.id);
      return {
        id: product.id,
        sku: product.sku,
        name: product.name,
        unit: product.unit,
        unitPrice: Number(product.unitPrice),
        isReturnable: product.isReturnable,
        isActive: product.isActive,
        unitsSold: sale?._sum.quantity ?? 0,
        revenue: Number(sale?._sum.lineTotal ?? 0),
      };
    }),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(Math.ceil(total / query.pageSize), 1),
  };
}

export async function getInventorySummary(companyId: string): Promise<InventorySummary> {
  const [totalSkus, activeSkus, bottleTotals] = await Promise.all([
    db.product.count({ where: { companyId } }),
    db.product.count({ where: { companyId, isActive: true } }),
    getBottleTotals(companyId),
  ]);

  return { totalSkus, activeSkus, bottlesInCirculation: bottleTotals.bottlesOut };
}
