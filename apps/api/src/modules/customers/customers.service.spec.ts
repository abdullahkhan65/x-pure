import { NotFoundException } from "@nestjs/common";
import { CustomersService } from "./customers.service";
import { PrismaService } from "../../prisma/prisma.service";

function buildCustomer(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "cust_1",
    companyId: "company_1",
    branchId: null,
    customerCode: "CUS-0001",
    name: "Ahmed Raza",
    phone: "0300-1234567",
    whatsapp: null,
    email: null,
    cnic: null,
    businessName: null,
    customerType: "RESIDENTIAL",
    status: "ACTIVE",
    preferredDeliveryTime: null,
    assignedSalespersonId: null,
    assignedRouteId: null,
    notes: null,
    deliveryInstructions: null,
    houseNumber: null,
    street: null,
    sector: null,
    area: null,
    city: null,
    province: null,
    postalCode: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    deletedAt: null,
    ...overrides,
  };
}

describe("CustomersService", () => {
  let service: CustomersService;
  let prisma: {
    client: {
      customer: {
        findMany: jest.Mock;
        findFirst: jest.Mock;
        count: jest.Mock;
        create: jest.Mock;
        update: jest.Mock;
      };
      counter: { upsert: jest.Mock };
      order: { aggregate: jest.Mock; findFirst: jest.Mock; count: jest.Mock };
      payment: { aggregate: jest.Mock };
      complaint: { count: jest.Mock };
      bottleLedgerEntry: { groupBy: jest.Mock };
    };
  };

  beforeEach(() => {
    prisma = {
      client: {
        customer: {
          findMany: jest.fn(),
          findFirst: jest.fn(),
          count: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
        },
        counter: { upsert: jest.fn() },
        order: { aggregate: jest.fn(), findFirst: jest.fn(), count: jest.fn() },
        payment: { aggregate: jest.fn() },
        complaint: { count: jest.fn() },
        bottleLedgerEntry: { groupBy: jest.fn() },
      },
    };
    service = new CustomersService(prisma as unknown as PrismaService);
  });

  describe("list", () => {
    it("scopes the query to the given company and paginates the result", async () => {
      const customer = buildCustomer();
      prisma.client.customer.findMany.mockResolvedValue([customer]);
      prisma.client.customer.count.mockResolvedValue(1);

      const result = await service.list("company_1", { page: 1, pageSize: 20, sortOrder: "desc" });

      expect(prisma.client.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ companyId: "company_1" }) }),
      );
      expect(result.total).toBe(1);
      expect(result.items[0]?.id).toBe(customer.id);
    });
  });

  describe("findOne", () => {
    it("throws NotFoundException when the customer doesn't exist in this company", async () => {
      prisma.client.customer.findFirst.mockResolvedValue(null);

      await expect(service.findOne("company_1", "missing")).rejects.toThrow(NotFoundException);
    });

    it("includes computed stats for an existing customer", async () => {
      prisma.client.customer.findFirst.mockResolvedValue(buildCustomer());
      prisma.client.order.aggregate.mockResolvedValue({ _sum: { total: null } });
      prisma.client.order.findFirst.mockResolvedValue(null);
      prisma.client.order.count.mockResolvedValue(0);
      prisma.client.payment.aggregate.mockResolvedValue({ _sum: { amount: null } });
      prisma.client.complaint.count.mockResolvedValue(0);
      prisma.client.bottleLedgerEntry.groupBy.mockResolvedValue([]);

      const result = await service.findOne("company_1", "cust_1");

      expect(result.stats).toEqual({
        lifetimeOrders: 0,
        lifetimeRevenue: 0,
        lastOrderDate: null,
        avgMonthlyOrders: 0,
        outstandingBalance: 0,
        bottlesHeld: 0,
        complaintsCount: 0,
      });
    });
  });

  describe("create", () => {
    it("assigns the next sequential customer code from the per-company counter", async () => {
      prisma.client.counter.upsert.mockResolvedValue({ value: 7 });
      prisma.client.customer.create.mockResolvedValue(buildCustomer({ customerCode: "CUS-0007" }));

      const result = await service.create("company_1", null, {
        name: "New Customer",
        phone: "0300-0000000",
        customerType: "RESIDENTIAL",
        status: "ACTIVE",
      });

      expect(prisma.client.customer.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ companyId: "company_1", customerCode: "CUS-0007" }) }),
      );
      expect(result.customerCode).toBe("CUS-0007");
    });
  });
});
