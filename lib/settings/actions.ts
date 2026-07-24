"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { CreateBranchSchema, UpdateBranchSchema, UpdateCompanySchema, permissionCode } from "@/lib/types";
import type { CreateBranchInput, UpdateBranchInput, UpdateCompanyInput } from "@/lib/types";
import { db } from "@/lib/db";
import { getCurrentUser, hasPermission } from "@/lib/auth/session";

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };

async function authorize() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, permissionCode("settings", "EDIT"))) return null;
  return user;
}

export async function updateCompany(input: UpdateCompanyInput): Promise<ActionResult> {
  const user = await authorize();
  if (!user) return { ok: false, error: "You don't have permission to change settings." };

  const parsed = UpdateCompanySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form for invalid fields." };

  await db.company.update({ where: { id: user.companyId }, data: parsed.data });
  revalidatePath("/settings");
  return { ok: true, data: null };
}

export async function createBranch(input: CreateBranchInput): Promise<ActionResult> {
  const user = await authorize();
  if (!user) return { ok: false, error: "You don't have permission to change settings." };

  const parsed = CreateBranchSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form for invalid fields." };
  const data = parsed.data;

  try {
    await db.branch.create({
      data: {
        companyId: user.companyId,
        name: data.name,
        code: data.code,
        address: data.address || null,
        phone: data.phone || null,
        isActive: data.isActive,
      },
    });
    revalidatePath("/settings");
    return { ok: true, data: null };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "A branch with this code already exists." };
    }
    throw error;
  }
}

export async function updateBranch(id: string, input: UpdateBranchInput): Promise<ActionResult> {
  const user = await authorize();
  if (!user) return { ok: false, error: "You don't have permission to change settings." };

  const parsed = UpdateBranchSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form for invalid fields." };
  const data = parsed.data;

  const existing = await db.branch.findFirst({ where: { companyId: user.companyId, id } });
  if (!existing) return { ok: false, error: "Branch not found." };

  try {
    await db.branch.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.code !== undefined ? { code: data.code } : {}),
        ...(data.address !== undefined ? { address: data.address || null } : {}),
        ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
    revalidatePath("/settings");
    return { ok: true, data: null };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "A branch with this code already exists." };
    }
    throw error;
  }
}

export async function deleteBranch(id: string): Promise<ActionResult> {
  const user = await authorize();
  if (!user) return { ok: false, error: "You don't have permission to change settings." };

  const existing = await db.branch.findFirst({ where: { companyId: user.companyId, id } });
  if (!existing) return { ok: false, error: "Branch not found." };

  const staffCount = await db.user.count({ where: { branchId: id } });
  if (staffCount > 0) {
    return { ok: false, error: "This branch has staff assigned. Reassign them before deleting." };
  }

  await db.branch.delete({ where: { id } });
  revalidatePath("/settings");
  return { ok: true, data: null };
}
