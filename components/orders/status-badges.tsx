import type { OrderPaymentStatus, OrderStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

type Variant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning";

const ORDER_STATUS_VARIANT: Record<OrderStatus, Variant> = {
  PENDING: "secondary",
  ASSIGNED: "warning",
  PACKED: "warning",
  OUT_FOR_DELIVERY: "warning",
  DELIVERED: "success",
  CANCELLED: "secondary",
  FAILED: "destructive",
};

const PAYMENT_STATUS_VARIANT: Record<OrderPaymentStatus, Variant> = {
  UNPAID: "destructive",
  PARTIAL: "warning",
  PAID: "success",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={ORDER_STATUS_VARIANT[status]}>{status.replace(/_/g, " ")}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: OrderPaymentStatus }) {
  return <Badge variant={PAYMENT_STATUS_VARIANT[status]}>{status}</Badge>;
}
