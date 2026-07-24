import { z } from "zod";
import { PaginationQuerySchema } from "./common.schema";

export const BottleDirectionSchema = z.enum(["ISSUED", "RETURNED", "LOST", "BROKEN", "TRANSFERRED", "PURCHASED"]);
export type BottleDirection = z.infer<typeof BottleDirectionSchema>;

export const DepositDirectionSchema = z.enum(["COLLECTED", "REFUNDED", "ADJUSTED"]);
export type DepositDirection = z.infer<typeof DepositDirectionSchema>;

export const CreateBottleEntrySchema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  direction: BottleDirectionSchema,
  quantity: z.number().int().positive("Enter a quantity"),
  notes: z.string().trim().max(500).optional(),
});
export type CreateBottleEntryInput = z.infer<typeof CreateBottleEntrySchema>;

export const CreateDepositEntrySchema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  direction: DepositDirectionSchema,
  amount: z.number().positive("Enter an amount"),
  notes: z.string().trim().max(500).optional(),
});
export type CreateDepositEntryInput = z.infer<typeof CreateDepositEntrySchema>;

export const BottleQuerySchema = PaginationQuerySchema.extend({
  search: z.string().trim().optional(),
});
export type BottleQuery = z.infer<typeof BottleQuerySchema>;

export interface BottleBalanceRow {
  customerId: string;
  customerName: string;
  customerCode: string;
  bottlesHeld: number;
  depositBalance: number;
}

export interface BottleTotals {
  bottlesOut: number;
  depositsHeld: number;
}
