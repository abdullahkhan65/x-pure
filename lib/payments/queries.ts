import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { PaymentListItem, PaymentQuery } from "@/lib/types";

export interface PaginatedPayments {
  items: PaymentListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function listPayments(companyId: string, query: PaymentQuery): Promise<PaginatedPayments> {
  const where: Prisma.PaymentWhereInput = {
    companyId,
    ...(query.method ? { method: query.method } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { reference: { contains: query.search, mode: "insensitive" } },
            { customer: { name: { contains: query.search, mode: "insensitive" } } },
            { order: { orderNumber: { contains: query.search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    db.payment.findMany({
      where,
      orderBy: { paidAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { customer: { select: { name: true } }, order: { select: { orderNumber: true } } },
    }),
    db.payment.count({ where }),
  ]);

  return {
    items: items.map((payment) => ({
      id: payment.id,
      customerId: payment.customerId,
      customerName: payment.customer.name,
      orderId: payment.orderId,
      orderNumber: payment.order?.orderNumber ?? null,
      amount: Number(payment.amount),
      method: payment.method,
      status: payment.status,
      reference: payment.reference,
      paidAt: payment.paidAt.toISOString(),
    })),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(Math.ceil(total / query.pageSize), 1),
  };
}

export interface OpenOrderOption {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  balance: number;
}

/** Orders that still owe money — offered in the payment form to auto-fill amount + customer. */
export async function listOpenOrderOptions(companyId: string): Promise<OpenOrderOption[]> {
  const orders = await db.order.findMany({
    where: { companyId, status: { not: "CANCELLED" }, paymentStatus: { not: "PAID" } },
    orderBy: { orderDate: "desc" },
    take: 200,
    include: {
      customer: { select: { name: true } },
      payments: { where: { status: "COMPLETED" }, select: { amount: true } },
    },
  });

  return orders
    .map((order) => {
      const paid = order.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        customerName: order.customer.name,
        balance: Math.max(Number(order.total) - paid, 0),
      };
    })
    .filter((o) => o.balance > 0);
}
