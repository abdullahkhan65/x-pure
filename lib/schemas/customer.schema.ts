import { z } from "zod";
import { PaginationQuerySchema } from "./common.schema";

export const CustomerTypeSchema = z.enum([
  "RESIDENTIAL",
  "COMMERCIAL",
  "GOVERNMENT",
  "SCHOOL",
  "HOSPITAL",
  "RESTAURANT",
  "OFFICE",
  "HOTEL",
  "INDUSTRIAL",
]);
export type CustomerType = z.infer<typeof CustomerTypeSchema>;

export const CustomerStatusSchema = z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]);
export type CustomerStatus = z.infer<typeof CustomerStatusSchema>;

const addressFields = {
  houseNumber: z.string().trim().max(50).optional(),
  street: z.string().trim().max(120).optional(),
  sector: z.string().trim().max(60).optional(),
  area: z.string().trim().max(60).optional(),
  city: z.string().trim().max(60).optional(),
  province: z.string().trim().max(60).optional(),
  postalCode: z.string().trim().max(20).optional(),
};

export const CreateCustomerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(1).max(30),
  whatsapp: z.string().trim().max(30).optional(),
  email: z.string().email().optional().or(z.literal("").transform(() => undefined)),
  cnic: z.string().trim().max(20).optional(),
  businessName: z.string().trim().max(150).optional(),
  customerType: CustomerTypeSchema,
  status: CustomerStatusSchema.default("ACTIVE"),
  preferredDeliveryTime: z.string().trim().max(60).optional(),
  assignedSalespersonId: z.string().optional(),
  assignedRouteId: z.string().optional(),
  notes: z.string().trim().max(2000).optional(),
  deliveryInstructions: z.string().trim().max(1000).optional(),
  ...addressFields,
});
export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;

export const UpdateCustomerSchema = CreateCustomerSchema.partial();
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;

export const CustomerQuerySchema = PaginationQuerySchema.extend({
  search: z.string().trim().optional(),
  customerType: CustomerTypeSchema.optional(),
  status: CustomerStatusSchema.optional(),
  assignedSalespersonId: z.string().optional(),
});
export type CustomerQuery = z.infer<typeof CustomerQuerySchema>;

export const CustomerStatsSchema = z.object({
  lifetimeOrders: z.number().int(),
  lifetimeRevenue: z.number(),
  lastOrderDate: z.string().nullable(),
  avgMonthlyOrders: z.number(),
  outstandingBalance: z.number(),
  bottlesHeld: z.number().int(),
  complaintsCount: z.number().int(),
});
export type CustomerStats = z.infer<typeof CustomerStatsSchema>;

export const CustomerResponseSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  branchId: z.string().nullable(),
  customerCode: z.string(),
  name: z.string(),
  phone: z.string(),
  whatsapp: z.string().nullable(),
  email: z.string().nullable(),
  cnic: z.string().nullable(),
  businessName: z.string().nullable(),
  customerType: CustomerTypeSchema,
  status: CustomerStatusSchema,
  preferredDeliveryTime: z.string().nullable(),
  assignedSalespersonId: z.string().nullable(),
  assignedRouteId: z.string().nullable(),
  notes: z.string().nullable(),
  deliveryInstructions: z.string().nullable(),
  houseNumber: z.string().nullable(),
  street: z.string().nullable(),
  sector: z.string().nullable(),
  area: z.string().nullable(),
  city: z.string().nullable(),
  province: z.string().nullable(),
  postalCode: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  stats: CustomerStatsSchema.optional(),
});
export type CustomerResponse = z.infer<typeof CustomerResponseSchema>;
