import type { Prisma, Customer } from "@prisma/client";
import { db } from "@/lib/db";
import type { CustomerQuery, CustomerResponse, CustomerStats } from "@/lib/types";

export interface PaginatedCustomers {
  items: CustomerResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const SORTABLE_FIELDS = new Set(["createdAt", "updatedAt", "name", "customerCode", "status", "customerType"]);
const MS_PER_MONTH = 30 * 24 * 60 * 60 * 1000;

export async function listCustomers(companyId: string, query: CustomerQuery): Promise<PaginatedCustomers> {
  const where: Prisma.CustomerWhereInput = {
    companyId,
    deletedAt: null,
    ...(query.customerType ? { customerType: query.customerType } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.assignedSalespersonId ? { assignedSalespersonId: query.assignedSalespersonId } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { phone: { contains: query.search, mode: "insensitive" } },
            { email: { contains: query.search, mode: "insensitive" } },
            { businessName: { contains: query.search, mode: "insensitive" } },
            { customerCode: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const sortField = query.sortBy && SORTABLE_FIELDS.has(query.sortBy) ? query.sortBy : "createdAt";
  const orderBy = { [sortField]: query.sortOrder } as Prisma.CustomerOrderByWithRelationInput;

  const [items, total] = await Promise.all([
    db.customer.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    db.customer.count({ where }),
  ]);

  return {
    items: items.map(toResponse),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(Math.ceil(total / query.pageSize), 1),
  };
}

export async function getCustomer(companyId: string, id: string): Promise<CustomerResponse | null> {
  const customer = await db.customer.findFirst({ where: { companyId, id, deletedAt: null } });
  if (!customer) return null;
  const stats = await getStats(companyId, id);
  return { ...toResponse(customer), stats };
}

export async function exportCustomersCsv(companyId: string): Promise<string> {
  const customers = await db.customer.findMany({
    where: { companyId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  const header = ["Customer Code", "Name", "Phone", "Email", "Type", "Status", "City", "Created At"];
  const rows = customers.map((customer) => [
    customer.customerCode,
    customer.name,
    customer.phone,
    customer.email ?? "",
    customer.customerType,
    customer.status,
    customer.city ?? "",
    customer.createdAt.toISOString(),
  ]);

  return [header, ...rows].map((row) => row.map(escapeCsvField).join(",")).join("\n");
}

/**
 * Real aggregate queries against Order/Payment/BottleLedgerEntry/Complaint — since none of
 * those modules has a write path yet, this honestly returns zeros against fresh data. That's
 * expected, not a bug: it'll start reflecting real numbers as those modules get built.
 */
async function getStats(companyId: string, customerId: string): Promise<CustomerStats> {
  const [orderAgg, firstOrder, lastOrder, orderCount, paymentAgg, complaintsCount, bottleAgg] = await Promise.all([
    db.order.aggregate({ where: { companyId, customerId }, _sum: { total: true } }),
    db.order.findFirst({ where: { companyId, customerId }, orderBy: { orderDate: "asc" } }),
    db.order.findFirst({ where: { companyId, customerId }, orderBy: { orderDate: "desc" } }),
    db.order.count({ where: { companyId, customerId } }),
    db.payment.aggregate({ where: { companyId, customerId }, _sum: { amount: true } }),
    db.complaint.count({ where: { companyId, customerId } }),
    db.bottleLedgerEntry.groupBy({
      by: ["direction"],
      where: { companyId, customerId },
      _sum: { quantity: true },
    }),
  ]);

  const lifetimeRevenue = Number(orderAgg._sum.total ?? 0);
  const outstandingBalance = Math.max(lifetimeRevenue - Number(paymentAgg._sum.amount ?? 0), 0);

  const bottlesIssued = bottleAgg.find((b) => b.direction === "ISSUED")?._sum.quantity ?? 0;
  const bottlesReturned = bottleAgg.find((b) => b.direction === "RETURNED")?._sum.quantity ?? 0;
  const bottlesHeld = Math.max(bottlesIssued - bottlesReturned, 0);

  const monthsActive = firstOrder
    ? Math.max(1, Math.ceil((Date.now() - firstOrder.orderDate.getTime()) / MS_PER_MONTH))
    : 1;

  return {
    lifetimeOrders: orderCount,
    lifetimeRevenue,
    lastOrderDate: lastOrder?.orderDate.toISOString() ?? null,
    avgMonthlyOrders: Number((orderCount / monthsActive).toFixed(2)),
    outstandingBalance,
    bottlesHeld,
    complaintsCount,
  };
}

export interface CustomerOption {
  id: string;
  name: string;
}

export async function listCustomerOptions(companyId: string): Promise<CustomerOption[]> {
  const customers = await db.customer.findMany({
    where: { companyId, deletedAt: null, status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, customerCode: true },
  });
  return customers.map((c) => ({ id: c.id, name: `${c.name} (${c.customerCode})` }));
}

export function toResponse(customer: Customer): CustomerResponse {
  return {
    id: customer.id,
    companyId: customer.companyId,
    branchId: customer.branchId,
    customerCode: customer.customerCode,
    name: customer.name,
    phone: customer.phone,
    whatsapp: customer.whatsapp,
    email: customer.email,
    cnic: customer.cnic,
    businessName: customer.businessName,
    customerType: customer.customerType,
    status: customer.status,
    preferredDeliveryTime: customer.preferredDeliveryTime,
    assignedSalespersonId: customer.assignedSalespersonId,
    assignedRouteId: customer.assignedRouteId,
    notes: customer.notes,
    deliveryInstructions: customer.deliveryInstructions,
    houseNumber: customer.houseNumber,
    street: customer.street,
    sector: customer.sector,
    area: customer.area,
    city: customer.city,
    province: customer.province,
    postalCode: customer.postalCode,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  };
}

function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
