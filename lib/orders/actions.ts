"use server";

import { revalidatePath } from "next/cache";
import { CreateOrderSchema, UpdateOrderSchema, UpdateOrderStatusSchema, permissionCode } from "@/lib/types";
import type { CreateOrderInput, OrderStatus, UpdateOrderInput } from "@/lib/types";
import { db } from "@/lib/db";
import { getCurrentUser, hasPermission } from "@/lib/auth/session";

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };

async function authorize(action: "CREATE" | "EDIT" | "DELETE" | "APPROVE") {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, permissionCode("orders", action))) return null;
  return user;
}

async function nextOrderNumber(companyId: string): Promise<string> {
  const counter = await db.counter.upsert({
    where: { companyId_key: { companyId, key: "order" } },
    create: { companyId, key: "order", value: 1 },
    update: { value: { increment: 1 } },
  });
  return `ORD-${String(counter.value).padStart(4, "0")}`;
}

export async function createOrder(input: CreateOrderInput): Promise<ActionResult<{ id: string }>> {
  const user = await authorize("CREATE");
  if (!user) return { ok: false, error: "You don't have permission to create orders." };

  const parsed = CreateOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form for invalid fields." };
  const data = parsed.data;

  const customer = await db.customer.findFirst({
    where: { companyId: user.companyId, id: data.customerId, deletedAt: null },
    select: { id: true, branchId: true },
  });
  if (!customer) return { ok: false, error: "Selected customer not found." };

  // Snapshot current product prices so later price changes don't rewrite historical orders.
  const productIds = data.items.map((item) => item.productId);
  const products = await db.product.findMany({
    where: { companyId: user.companyId, id: { in: productIds } },
  });
  const productById = new Map(products.map((p) => [p.id, p]));
  if (data.items.some((item) => !productById.has(item.productId))) {
    return { ok: false, error: "One or more selected products are invalid." };
  }

  const lineItems = data.items.map((item) => {
    const product = productById.get(item.productId)!;
    const unitPrice = Number(product.unitPrice);
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice,
      lineTotal: unitPrice * item.quantity,
      bottlesOut: product.isReturnable ? item.quantity : 0,
    };
  });

  const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const total = Math.max(subtotal - data.discount + data.tax, 0);
  const orderNumber = await nextOrderNumber(user.companyId);

  const order = await db.order.create({
    data: {
      companyId: user.companyId,
      branchId: customer.branchId,
      customerId: data.customerId,
      orderNumber,
      deliveryRouteId: data.deliveryRouteId || null,
      assignedRiderId: data.assignedRiderId || null,
      deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
      subtotal,
      discount: data.discount,
      tax: data.tax,
      total,
      notes: data.notes || null,
      status: data.assignedRiderId ? "ASSIGNED" : "PENDING",
      items: { create: lineItems },
    },
  });

  revalidatePath("/orders");
  return { ok: true, data: { id: order.id } };
}

export async function updateOrder(id: string, input: UpdateOrderInput): Promise<ActionResult> {
  const user = await authorize("EDIT");
  if (!user) return { ok: false, error: "You don't have permission to edit orders." };

  const parsed = UpdateOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form for invalid fields." };
  const data = parsed.data;

  const existing = await db.order.findFirst({ where: { companyId: user.companyId, id } });
  if (!existing) return { ok: false, error: "Order not found." };

  const discount = data.discount ?? Number(existing.discount);
  const tax = data.tax ?? Number(existing.tax);
  const total = Math.max(Number(existing.subtotal) - discount + tax, 0);

  await db.order.update({
    where: { id },
    data: {
      deliveryRouteId: data.deliveryRouteId !== undefined ? data.deliveryRouteId || null : undefined,
      assignedRiderId: data.assignedRiderId !== undefined ? data.assignedRiderId || null : undefined,
      deliveryDate: data.deliveryDate !== undefined ? (data.deliveryDate ? new Date(data.deliveryDate) : null) : undefined,
      notes: data.notes !== undefined ? data.notes || null : undefined,
      discount,
      tax,
      total,
    },
  });

  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
  return { ok: true, data: null };
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<ActionResult> {
  const user = await authorize("EDIT");
  if (!user) return { ok: false, error: "You don't have permission to update orders." };

  const parsed = UpdateOrderStatusSchema.safeParse({ status });
  if (!parsed.success) return { ok: false, error: "Invalid status." };

  const order = await db.order.findFirst({
    where: { companyId: user.companyId, id },
    include: { items: true },
  });
  if (!order) return { ok: false, error: "Order not found." };

  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id },
      data: {
        status,
        ...(status === "DELIVERED" && !order.deliveryDate ? { deliveryDate: new Date() } : {}),
      },
    });

    // On delivery, record the bottles that left with the order — once per order.
    if (status === "DELIVERED") {
      const alreadyLogged = await tx.bottleLedgerEntry.count({ where: { orderId: id, direction: "ISSUED" } });
      if (alreadyLogged === 0) {
        const issued = order.items.filter((item) => item.bottlesOut > 0);
        for (const item of issued) {
          await tx.bottleLedgerEntry.create({
            data: {
              companyId: order.companyId,
              customerId: order.customerId,
              orderId: order.id,
              direction: "ISSUED",
              quantity: item.bottlesOut,
              createdByUserId: user.id,
            },
          });
        }
      }
    }
  });

  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
  return { ok: true, data: null };
}

export async function deleteOrder(id: string): Promise<ActionResult> {
  const user = await authorize("DELETE");
  if (!user) return { ok: false, error: "You don't have permission to delete orders." };

  const existing = await db.order.findFirst({ where: { companyId: user.companyId, id } });
  if (!existing) return { ok: false, error: "Order not found." };
  if (existing.status === "DELIVERED") {
    return { ok: false, error: "Delivered orders can't be deleted. Keep them for records." };
  }

  await db.order.delete({ where: { id } });
  revalidatePath("/orders");
  return { ok: true, data: null };
}
