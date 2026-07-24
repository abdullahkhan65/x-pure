"use server";

import { revalidatePath } from "next/cache";
import { CreateCustomerSchema, UpdateCustomerSchema, permissionCode } from "@/lib/types";
import type { CreateCustomerInput, CustomerResponse, UpdateCustomerInput } from "@/lib/types";
import { db } from "@/lib/db";
import { getCurrentUser, hasPermission } from "@/lib/auth/session";
import { toResponse } from "./queries";

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };

async function authorize(action: "CREATE" | "EDIT" | "DELETE") {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!hasPermission(user, permissionCode("customers", action))) return null;
  return user;
}

export async function createCustomer(input: CreateCustomerInput): Promise<ActionResult<CustomerResponse>> {
  const user = await authorize("CREATE");
  if (!user) return { ok: false, error: "You don't have permission to create customers." };

  const parsed = CreateCustomerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form for invalid fields." };

  const customerCode = await nextCustomerCode(user.companyId);
  const customer = await db.customer.create({
    data: { companyId: user.companyId, branchId: user.branchId, customerCode, ...parsed.data },
  });

  revalidatePath("/customers");
  return { ok: true, data: toResponse(customer) };
}

export async function updateCustomer(id: string, input: UpdateCustomerInput): Promise<ActionResult<CustomerResponse>> {
  const user = await authorize("EDIT");
  if (!user) return { ok: false, error: "You don't have permission to edit customers." };

  const parsed = UpdateCustomerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form for invalid fields." };

  const existing = await db.customer.findFirst({ where: { companyId: user.companyId, id, deletedAt: null } });
  if (!existing) return { ok: false, error: "Customer not found." };

  const customer = await db.customer.update({ where: { id }, data: parsed.data });

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  return { ok: true, data: toResponse(customer) };
}

export async function deleteCustomer(id: string): Promise<ActionResult> {
  const user = await authorize("DELETE");
  if (!user) return { ok: false, error: "You don't have permission to delete customers." };

  const existing = await db.customer.findFirst({ where: { companyId: user.companyId, id, deletedAt: null } });
  if (!existing) return { ok: false, error: "Customer not found." };

  await db.customer.update({ where: { id }, data: { deletedAt: new Date() } });

  revalidatePath("/customers");
  return { ok: true, data: null };
}

async function nextCustomerCode(companyId: string): Promise<string> {
  const counter = await db.counter.upsert({
    where: { companyId_key: { companyId, key: "customer" } },
    create: { companyId, key: "customer", value: 1 },
    update: { value: { increment: 1 } },
  });
  return `CUS-${String(counter.value).padStart(4, "0")}`;
}
