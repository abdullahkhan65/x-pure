import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { BottleBalanceRow, BottleQuery, BottleTotals } from "@/lib/types";

export interface PaginatedBalances {
  items: BottleBalanceRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Only ISSUED adds to outstanding bottles; every other movement removes from it.
function signedBottles(direction: string, quantity: number): number {
  return direction === "ISSUED" ? quantity : -quantity;
}

// Deposits: collected/adjusted add, refunded subtracts.
function signedDeposit(direction: string, amount: number): number {
  return direction === "REFUNDED" ? -amount : amount;
}

export async function listBottleBalances(companyId: string, query: BottleQuery): Promise<PaginatedBalances> {
  const where: Prisma.CustomerWhereInput = {
    companyId,
    deletedAt: null,
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { customerCode: { contains: query.search, mode: "insensitive" } },
            { phone: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [customers, total] = await Promise.all([
    db.customer.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: { id: true, name: true, customerCode: true },
    }),
    db.customer.count({ where }),
  ]);

  const ids = customers.map((c) => c.id);
  const [bottleGroups, depositGroups] = await Promise.all([
    db.bottleLedgerEntry.groupBy({
      by: ["customerId", "direction"],
      where: { companyId, customerId: { in: ids } },
      _sum: { quantity: true },
    }),
    db.depositLedgerEntry.groupBy({
      by: ["customerId", "direction"],
      where: { companyId, customerId: { in: ids } },
      _sum: { amount: true },
    }),
  ]);

  const bottlesByCustomer = new Map<string, number>();
  for (const group of bottleGroups) {
    const current = bottlesByCustomer.get(group.customerId) ?? 0;
    bottlesByCustomer.set(group.customerId, current + signedBottles(group.direction, group._sum.quantity ?? 0));
  }

  const depositByCustomer = new Map<string, number>();
  for (const group of depositGroups) {
    const current = depositByCustomer.get(group.customerId) ?? 0;
    depositByCustomer.set(group.customerId, current + signedDeposit(group.direction, Number(group._sum.amount ?? 0)));
  }

  return {
    items: customers.map((customer) => ({
      customerId: customer.id,
      customerName: customer.name,
      customerCode: customer.customerCode,
      bottlesHeld: Math.max(bottlesByCustomer.get(customer.id) ?? 0, 0),
      depositBalance: Math.max(depositByCustomer.get(customer.id) ?? 0, 0),
    })),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(Math.ceil(total / query.pageSize), 1),
  };
}

export async function getBottleTotals(companyId: string): Promise<BottleTotals> {
  const [bottleGroups, depositGroups] = await Promise.all([
    db.bottleLedgerEntry.groupBy({ by: ["direction"], where: { companyId }, _sum: { quantity: true } }),
    db.depositLedgerEntry.groupBy({ by: ["direction"], where: { companyId }, _sum: { amount: true } }),
  ]);

  const bottlesOut = bottleGroups.reduce((sum, g) => sum + signedBottles(g.direction, g._sum.quantity ?? 0), 0);
  const depositsHeld = depositGroups.reduce((sum, g) => sum + signedDeposit(g.direction, Number(g._sum.amount ?? 0)), 0);

  return { bottlesOut: Math.max(bottlesOut, 0), depositsHeld: Math.max(depositsHeld, 0) };
}
