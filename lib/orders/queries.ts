import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { OrderDetail, OrderListItem, OrderQuery } from "@/lib/types";

export interface PaginatedOrders {
  items: OrderListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function listOrders(companyId: string, query: OrderQuery): Promise<PaginatedOrders> {
  const where: Prisma.OrderWhereInput = {
    companyId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.paymentStatus ? { paymentStatus: query.paymentStatus } : {}),
    ...(query.customerId ? { customerId: query.customerId } : {}),
    ...(query.search
      ? {
          OR: [
            { orderNumber: { contains: query.search, mode: "insensitive" } },
            { customer: { name: { contains: query.search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { orderDate: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { customer: { select: { name: true } }, _count: { select: { items: true } } },
    }),
    db.order.count({ where }),
  ]);

  return {
    items: items.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: order.customer.name,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: Number(order.total),
      itemCount: order._count.items,
      orderDate: order.orderDate.toISOString(),
    })),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(Math.ceil(total / query.pageSize), 1),
  };
}

export async function getOrder(companyId: string, id: string): Promise<OrderDetail | null> {
  const order = await db.order.findFirst({
    where: { companyId, id },
    include: {
      customer: { select: { name: true } },
      deliveryRoute: { select: { name: true } },
      assignedRider: { select: { firstName: true, lastName: true } },
      items: { include: { product: { select: { name: true } } } },
      payments: { where: { status: "COMPLETED" }, select: { amount: true } },
    },
  });
  if (!order) return null;

  const amountPaid = order.payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerId: order.customerId,
    customerName: order.customer.name,
    status: order.status,
    paymentStatus: order.paymentStatus,
    routeName: order.deliveryRoute?.name ?? null,
    riderName: order.assignedRider ? `${order.assignedRider.firstName} ${order.assignedRider.lastName}` : null,
    orderDate: order.orderDate.toISOString(),
    deliveryDate: order.deliveryDate?.toISOString() ?? null,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    tax: Number(order.tax),
    total: Number(order.total),
    amountPaid,
    notes: order.notes,
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.product.name,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
    })),
  };
}
