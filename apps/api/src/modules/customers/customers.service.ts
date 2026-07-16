import { Injectable, NotFoundException } from "@nestjs/common";
import type { CreateCustomerInput, CustomerQuery, CustomerResponse, CustomerStats, UpdateCustomerInput } from "@x-pure/types";
import { Prisma } from "@x-pure/database";
import { PrismaService } from "../../prisma/prisma.service";

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const SORTABLE_FIELDS = new Set(["createdAt", "updatedAt", "name", "customerCode", "status", "customerType"]);
const MS_PER_MONTH = 30 * 24 * 60 * 60 * 1000;

type CustomerRecord = Prisma.CustomerGetPayload<Record<string, never>>;

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(companyId: string, query: CustomerQuery): Promise<PaginatedResult<CustomerResponse>> {
    const where: Prisma.CustomerWhereInput = {
      companyId,
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
      this.prisma.client.customer.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.client.customer.count({ where }),
    ]);

    return {
      items: items.map(toResponse),
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.max(Math.ceil(total / query.pageSize), 1),
    };
  }

  async findOne(companyId: string, id: string): Promise<CustomerResponse> {
    const customer = await this.prisma.client.customer.findFirst({ where: { companyId, id } });
    if (!customer) throw new NotFoundException("Customer not found");
    const stats = await this.getStats(companyId, id);
    return { ...toResponse(customer), stats };
  }

  async create(companyId: string, branchId: string | null, input: CreateCustomerInput): Promise<CustomerResponse> {
    const customerCode = await this.nextCustomerCode(companyId);
    const customer = await this.prisma.client.customer.create({
      data: { companyId, branchId, customerCode, ...input },
    });
    return toResponse(customer);
  }

  async update(companyId: string, id: string, input: UpdateCustomerInput): Promise<CustomerResponse> {
    await this.assertExists(companyId, id);
    const customer = await this.prisma.client.customer.update({
      where: { companyId, id },
      data: input,
    });
    return toResponse(customer);
  }

  async softDelete(companyId: string, id: string): Promise<void> {
    await this.assertExists(companyId, id);
    await this.prisma.client.customer.update({
      where: { companyId, id },
      data: { deletedAt: new Date() },
    });
  }

  async exportCsv(companyId: string): Promise<string> {
    const customers = await this.prisma.client.customer.findMany({
      where: { companyId },
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
  private async getStats(companyId: string, customerId: string): Promise<CustomerStats> {
    const [orderAgg, firstOrder, lastOrder, orderCount, paymentAgg, complaintsCount, bottleAgg] = await Promise.all([
      this.prisma.client.order.aggregate({ where: { companyId, customerId }, _sum: { total: true } }),
      this.prisma.client.order.findFirst({ where: { companyId, customerId }, orderBy: { orderDate: "asc" } }),
      this.prisma.client.order.findFirst({ where: { companyId, customerId }, orderBy: { orderDate: "desc" } }),
      this.prisma.client.order.count({ where: { companyId, customerId } }),
      this.prisma.client.payment.aggregate({ where: { companyId, customerId }, _sum: { amount: true } }),
      this.prisma.client.complaint.count({ where: { companyId, customerId } }),
      this.prisma.client.bottleLedgerEntry.groupBy({
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

    const monthsActive = firstOrder ? Math.max(1, Math.ceil((Date.now() - firstOrder.orderDate.getTime()) / MS_PER_MONTH)) : 1;

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

  private async nextCustomerCode(companyId: string): Promise<string> {
    const counter = await this.prisma.client.counter.upsert({
      where: { companyId_key: { companyId, key: "customer" } },
      create: { companyId, key: "customer", value: 1 },
      update: { value: { increment: 1 } },
    });
    return `CUS-${String(counter.value).padStart(4, "0")}`;
  }

  private async assertExists(companyId: string, id: string) {
    const existing = await this.prisma.client.customer.findFirst({ where: { companyId, id } });
    if (!existing) throw new NotFoundException("Customer not found");
  }
}

function toResponse(customer: CustomerRecord): CustomerResponse {
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
