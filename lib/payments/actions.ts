"use server";

import { revalidatePath } from "next/cache";
import type { Prisma, PrismaClient } from "@prisma/client";
import { CreatePaymentSchema, UpdatePaymentSchema, permissionCode } from "@/lib/types";
import type { CreatePaymentInput, UpdatePaymentInput } from "@/lib/types";
import { db } from "@/lib/db";
import { getCurrentUser, hasPermission } from "@/lib/auth/session";

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };

type Client = PrismaClient | Prisma.TransactionClient;

async function authorize(action: "CREATE" | "EDIT") {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, permissionCode("payments", action))) return null;
  return user;
}

/** Recompute an order's UNPAID/PARTIAL/PAID status from its completed payments. */
async function recomputeOrderPaymentStatus(client: Client, orderId: string): Promise<void> {
  const order = await client.order.findUnique({ where: { id: orderId }, select: { total: true } });
  if (!order) return;

  const agg = await client.payment.aggregate({
    where: { orderId, status: "COMPLETED" },
    _sum: { amount: true },
  });
  const paid = Number(agg._sum.amount ?? 0);
  const total = Number(order.total);

  const paymentStatus = paid <= 0 ? "UNPAID" : paid >= total ? "PAID" : "PARTIAL";
  await client.order.update({ where: { id: orderId }, data: { paymentStatus } });
}

export async function createPayment(input: CreatePaymentInput): Promise<ActionResult> {
  const user = await authorize("CREATE");
  if (!user) return { ok: false, error: "You don't have permission to record payments." };

  const parsed = CreatePaymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form for invalid fields." };
  const data = parsed.data;

  const customer = await db.customer.findFirst({
    where: { companyId: user.companyId, id: data.customerId, deletedAt: null },
    select: { id: true },
  });
  if (!customer) return { ok: false, error: "Selected customer not found." };

  if (data.orderId) {
    const order = await db.order.findFirst({
      where: { companyId: user.companyId, id: data.orderId, customerId: data.customerId },
      select: { id: true },
    });
    if (!order) return { ok: false, error: "Selected order doesn't belong to this customer." };
  }

  await db.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        companyId: user.companyId,
        customerId: data.customerId,
        orderId: data.orderId || null,
        amount: data.amount,
        method: data.method,
        status: data.status,
        reference: data.reference || null,
        receivedByUserId: user.id,
        paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
      },
    });
    if (data.orderId) await recomputeOrderPaymentStatus(tx, data.orderId);
  });

  revalidatePath("/payments");
  revalidatePath("/orders");
  return { ok: true, data: null };
}

export async function updatePayment(id: string, input: UpdatePaymentInput): Promise<ActionResult> {
  const user = await authorize("EDIT");
  if (!user) return { ok: false, error: "You don't have permission to edit payments." };

  const parsed = UpdatePaymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form for invalid fields." };
  const data = parsed.data;

  const existing = await db.payment.findFirst({ where: { companyId: user.companyId, id } });
  if (!existing) return { ok: false, error: "Payment not found." };

  await db.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id },
      data: {
        ...(data.amount !== undefined ? { amount: data.amount } : {}),
        ...(data.method !== undefined ? { method: data.method } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.reference !== undefined ? { reference: data.reference || null } : {}),
      },
    });
    if (existing.orderId) await recomputeOrderPaymentStatus(tx, existing.orderId);
  });

  revalidatePath("/payments");
  revalidatePath("/orders");
  return { ok: true, data: null };
}
