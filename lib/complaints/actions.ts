"use server";

import { revalidatePath } from "next/cache";
import { CreateComplaintSchema, UpdateComplaintSchema, permissionCode } from "@/lib/types";
import type { CreateComplaintInput, UpdateComplaintInput } from "@/lib/types";
import { db } from "@/lib/db";
import { getCurrentUser, hasPermission } from "@/lib/auth/session";

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };

async function authorize(action: "CREATE" | "EDIT" | "DELETE") {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, permissionCode("complaints", action))) return null;
  return user;
}

export async function createComplaint(input: CreateComplaintInput): Promise<ActionResult> {
  const user = await authorize("CREATE");
  if (!user) return { ok: false, error: "You don't have permission to log complaints." };

  const parsed = CreateComplaintSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form for invalid fields." };
  const data = parsed.data;

  const customer = await db.customer.findFirst({
    where: { companyId: user.companyId, id: data.customerId, deletedAt: null },
    select: { id: true },
  });
  if (!customer) return { ok: false, error: "Selected customer not found." };

  await db.complaint.create({
    data: {
      companyId: user.companyId,
      customerId: data.customerId,
      category: data.category,
      priority: data.priority,
      description: data.description,
      assignedToUserId: data.assignedToUserId || null,
      status: data.assignedToUserId ? "ASSIGNED" : "OPEN",
    },
  });

  revalidatePath("/complaints");
  return { ok: true, data: null };
}

export async function updateComplaint(id: string, input: UpdateComplaintInput): Promise<ActionResult> {
  const user = await authorize("EDIT");
  if (!user) return { ok: false, error: "You don't have permission to update complaints." };

  const parsed = UpdateComplaintSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form for invalid fields." };
  const data = parsed.data;

  const existing = await db.complaint.findFirst({ where: { companyId: user.companyId, id } });
  if (!existing) return { ok: false, error: "Complaint not found." };

  const isClosing = data.status === "RESOLVED" || data.status === "CLOSED";

  await db.complaint.update({
    where: { id },
    data: {
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.priority !== undefined ? { priority: data.priority } : {}),
      ...(data.assignedToUserId !== undefined ? { assignedToUserId: data.assignedToUserId || null } : {}),
      ...(data.resolutionNotes !== undefined ? { resolutionNotes: data.resolutionNotes || null } : {}),
      ...(isClosing && !existing.resolvedAt ? { resolvedAt: new Date() } : {}),
    },
  });

  revalidatePath("/complaints");
  return { ok: true, data: null };
}

export async function deleteComplaint(id: string): Promise<ActionResult> {
  const user = await authorize("DELETE");
  if (!user) return { ok: false, error: "You don't have permission to delete complaints." };

  const existing = await db.complaint.findFirst({ where: { companyId: user.companyId, id } });
  if (!existing) return { ok: false, error: "Complaint not found." };

  await db.complaint.delete({ where: { id } });
  revalidatePath("/complaints");
  return { ok: true, data: null };
}
