import { z } from "zod";
import { PaginationQuerySchema } from "./common.schema";

export const PaymentMethodSchema = z.enum([
  "CASH",
  "BANK_TRANSFER",
  "EASYPAISA",
  "JAZZCASH",
  "CARD",
  "CREDIT",
  "CHEQUE",
]);
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export const PaymentTxnStatusSchema = z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED"]);
export type PaymentTxnStatus = z.infer<typeof PaymentTxnStatusSchema>;

export const CreatePaymentSchema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  orderId: z.string().optional(),
  amount: z.number().positive("Enter an amount"),
  method: PaymentMethodSchema,
  status: PaymentTxnStatusSchema.default("COMPLETED"),
  reference: z.string().trim().max(120).optional(),
  paidAt: z.string().optional(),
});
export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;

export const UpdatePaymentSchema = z.object({
  amount: z.number().positive().optional(),
  method: PaymentMethodSchema.optional(),
  status: PaymentTxnStatusSchema.optional(),
  reference: z.string().trim().max(120).optional(),
});
export type UpdatePaymentInput = z.infer<typeof UpdatePaymentSchema>;

export const PaymentQuerySchema = PaginationQuerySchema.extend({
  search: z.string().trim().optional(),
  method: PaymentMethodSchema.optional(),
  status: PaymentTxnStatusSchema.optional(),
});
export type PaymentQuery = z.infer<typeof PaymentQuerySchema>;

export interface PaymentListItem {
  id: string;
  customerId: string;
  customerName: string;
  orderId: string | null;
  orderNumber: string | null;
  amount: number;
  method: PaymentMethod;
  status: PaymentTxnStatus;
  reference: string | null;
  paidAt: string;
}
