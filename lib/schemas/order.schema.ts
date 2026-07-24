import { z } from "zod";
import { PaginationQuerySchema } from "./common.schema";

export const OrderStatusSchema = z.enum([
  "PENDING",
  "ASSIGNED",
  "PACKED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "FAILED",
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const OrderPaymentStatusSchema = z.enum(["UNPAID", "PARTIAL", "PAID"]);
export type OrderPaymentStatus = z.infer<typeof OrderPaymentStatusSchema>;

export const OrderItemInputSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  quantity: z.number().int().min(1),
});

export const CreateOrderSchema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  deliveryRouteId: z.string().optional(),
  assignedRiderId: z.string().optional(),
  deliveryDate: z.string().optional(),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  notes: z.string().trim().max(2000).optional(),
  items: z.array(OrderItemInputSchema).min(1, "Add at least one item"),
});
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export const UpdateOrderSchema = z.object({
  deliveryRouteId: z.string().optional(),
  assignedRiderId: z.string().optional(),
  deliveryDate: z.string().optional(),
  discount: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  notes: z.string().trim().max(2000).optional(),
});
export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>;

export const UpdateOrderStatusSchema = z.object({ status: OrderStatusSchema });

export const OrderQuerySchema = PaginationQuerySchema.extend({
  search: z.string().trim().optional(),
  status: OrderStatusSchema.optional(),
  paymentStatus: OrderPaymentStatusSchema.optional(),
  customerId: z.string().optional(),
});
export type OrderQuery = z.infer<typeof OrderQuerySchema>;

export interface OrderListItem {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  total: number;
  itemCount: number;
  orderDate: string;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  routeName: string | null;
  riderName: string | null;
  orderDate: string;
  deliveryDate: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  notes: string | null;
  items: {
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
}
