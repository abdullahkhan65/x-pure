import { db } from "@/lib/db";
import type { OrderStatus, PaymentMethod } from "@/lib/types";

export interface ReportsSummary {
  totalRevenue: number;
  revenueThisMonth: number;
  outstandingReceivables: number;
  totalCustomers: number;
  ordersByStatus: { status: OrderStatus; count: number }[];
  paymentsByMethod: { method: PaymentMethod; total: number }[];
  topCustomers: { id: string; name: string; revenue: number }[];
}

export async function getReportsSummary(companyId: string): Promise<ReportsSummary> {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [revenueAgg, monthAgg, paymentAgg, customers, statusGroups, methodGroups, topGroups] = await Promise.all([
    db.order.aggregate({ where: { companyId, status: { not: "CANCELLED" } }, _sum: { total: true } }),
    db.order.aggregate({
      where: { companyId, status: { not: "CANCELLED" }, orderDate: { gte: monthStart } },
      _sum: { total: true },
    }),
    db.payment.aggregate({ where: { companyId, status: "COMPLETED" }, _sum: { amount: true } }),
    db.customer.count({ where: { companyId, deletedAt: null } }),
    db.order.groupBy({ by: ["status"], where: { companyId }, _count: { _all: true } }),
    db.payment.groupBy({ by: ["method"], where: { companyId, status: "COMPLETED" }, _sum: { amount: true } }),
    db.order.groupBy({
      by: ["customerId"],
      where: { companyId, status: { not: "CANCELLED" } },
      _sum: { total: true },
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    }),
  ]);

  const totalRevenue = Number(revenueAgg._sum.total ?? 0);
  const totalPaid = Number(paymentAgg._sum.amount ?? 0);

  const topCustomerIds = topGroups.map((g) => g.customerId);
  const topCustomerRecords = topCustomerIds.length
    ? await db.customer.findMany({ where: { id: { in: topCustomerIds } }, select: { id: true, name: true } })
    : [];
  const nameById = new Map(topCustomerRecords.map((c) => [c.id, c.name]));

  return {
    totalRevenue,
    revenueThisMonth: Number(monthAgg._sum.total ?? 0),
    outstandingReceivables: Math.max(totalRevenue - totalPaid, 0),
    totalCustomers: customers,
    ordersByStatus: statusGroups
      .map((g) => ({ status: g.status, count: g._count._all }))
      .sort((a, b) => b.count - a.count),
    paymentsByMethod: methodGroups
      .map((g) => ({ method: g.method, total: Number(g._sum.amount ?? 0) }))
      .sort((a, b) => b.total - a.total),
    topCustomers: topGroups.map((g) => ({
      id: g.customerId,
      name: nameById.get(g.customerId) ?? "Unknown",
      revenue: Number(g._sum.total ?? 0),
    })),
  };
}
