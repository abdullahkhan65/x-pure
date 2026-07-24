import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { RouteQuery, RouteResponse } from "@/lib/types";

export interface PaginatedRoutes {
  items: RouteResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function listRoutes(companyId: string, query: RouteQuery): Promise<PaginatedRoutes> {
  const where: Prisma.DeliveryRouteWhereInput = {
    companyId,
    ...(query.isActive ? { isActive: query.isActive === "true" } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { code: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    db.deliveryRoute.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { branch: { select: { name: true } }, _count: { select: { customers: true } } },
    }),
    db.deliveryRoute.count({ where }),
  ]);

  return {
    items: items.map((route) => ({
      id: route.id,
      name: route.name,
      code: route.code,
      branchId: route.branchId,
      branchName: route.branch?.name ?? null,
      isActive: route.isActive,
      customerCount: route._count.customers,
      createdAt: route.createdAt.toISOString(),
    })),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(Math.ceil(total / query.pageSize), 1),
  };
}

export interface RouteOption {
  id: string;
  name: string;
}

export async function listRouteOptions(companyId: string): Promise<RouteOption[]> {
  const routes = await db.deliveryRoute.findMany({
    where: { companyId, isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return routes;
}
