"use server";

import { revalidatePath } from "next/cache";
import { CreateBottleEntrySchema, CreateDepositEntrySchema, permissionCode } from "@/lib/types";
import type { CreateBottleEntryInput, CreateDepositEntryInput } from "@/lib/types";
import { db } from "@/lib/db";
import { getCurrentUser, hasPermission } from "@/lib/auth/session";

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };

async function authorize() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, permissionCode("bottle_security", "CREATE"))) return null;
  return user;
}

async function assertCustomer(companyId: string, customerId: string): Promise<boolean> {
  const customer = await db.customer.findFirst({
    where: { companyId, id: customerId, deletedAt: null },
    select: { id: true },
  });
  return !!customer;
}

export async function recordBottleEntry(input: CreateBottleEntryInput): Promise<ActionResult> {
  const user = await authorize();
  if (!user) return { ok: false, error: "You don't have permission to record bottle movements." };

  const parsed = CreateBottleEntrySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form for invalid fields." };
  const data = parsed.data;

  if (!(await assertCustomer(user.companyId, data.customerId))) {
    return { ok: false, error: "Selected customer not found." };
  }

  await db.bottleLedgerEntry.create({
    data: {
      companyId: user.companyId,
      customerId: data.customerId,
      direction: data.direction,
      quantity: data.quantity,
      notes: data.notes || null,
      createdByUserId: user.id,
    },
  });

  revalidatePath("/bottle-security");
  return { ok: true, data: null };
}

export async function recordDepositEntry(input: CreateDepositEntryInput): Promise<ActionResult> {
  const user = await authorize();
  if (!user) return { ok: false, error: "You don't have permission to record deposits." };

  const parsed = CreateDepositEntrySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form for invalid fields." };
  const data = parsed.data;

  if (!(await assertCustomer(user.companyId, data.customerId))) {
    return { ok: false, error: "Selected customer not found." };
  }

  await db.depositLedgerEntry.create({
    data: {
      companyId: user.companyId,
      customerId: data.customerId,
      direction: data.direction,
      amount: data.amount,
      notes: data.notes || null,
      createdByUserId: user.id,
    },
  });

  revalidatePath("/bottle-security");
  return { ok: true, data: null };
}
