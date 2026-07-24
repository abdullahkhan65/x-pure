import { z } from "zod";
import { PaginationQuerySchema } from "./common.schema";

export const ProductUnitSchema = z.enum(["BOTTLE", "ITEM"]);
export type ProductUnit = z.infer<typeof ProductUnitSchema>;

export const CreateProductSchema = z.object({
  sku: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  unit: ProductUnitSchema.default("BOTTLE"),
  unitPrice: z.number().min(0),
  depositAmount: z.number().min(0).optional(),
  isReturnable: z.boolean().default(true),
  isActive: z.boolean().default(true),
});
export type CreateProductInput = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = CreateProductSchema.partial();
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;

export const ProductQuerySchema = PaginationQuerySchema.extend({
  search: z.string().trim().optional(),
  unit: ProductUnitSchema.optional(),
  isActive: z.enum(["true", "false"]).optional(),
});
export type ProductQuery = z.infer<typeof ProductQuerySchema>;

export const ProductResponseSchema = z.object({
  id: z.string(),
  sku: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  unit: ProductUnitSchema,
  unitPrice: z.number(),
  depositAmount: z.number().nullable(),
  isReturnable: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ProductResponse = z.infer<typeof ProductResponseSchema>;
