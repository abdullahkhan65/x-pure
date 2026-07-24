"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { hash } from "@node-rs/argon2";
import { CreateEmployeeSchema, UpdateEmployeeSchema, permissionCode } from "@/lib/types";
import type { CreateEmployeeInput, UpdateEmployeeInput } from "@/lib/types";
import { db } from "@/lib/db";
import { getCurrentUser, hasPermission } from "@/lib/auth/session";

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };

async function authorize(action: "CREATE" | "EDIT" | "DELETE") {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, permissionCode("employees", action))) return null;
  return user;
}

async function roleBelongsToCompany(companyId: string, roleId: string): Promise<boolean> {
  const role = await db.role.findFirst({ where: { companyId, id: roleId }, select: { id: true } });
  return !!role;
}

export async function createEmployee(input: CreateEmployeeInput): Promise<ActionResult> {
  const user = await authorize("CREATE");
  if (!user) return { ok: false, error: "You don't have permission to add employees." };

  const parsed = CreateEmployeeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form for invalid fields." };
  const data = parsed.data;

  if (!(await roleBelongsToCompany(user.companyId, data.roleId))) {
    return { ok: false, error: "Selected role is invalid." };
  }

  try {
    await db.user.create({
      data: {
        companyId: user.companyId,
        branchId: data.branchId || null,
        roleId: data.roleId,
        email: data.email,
        phone: data.phone || null,
        firstName: data.firstName,
        lastName: data.lastName,
        status: data.status,
        passwordHash: await hash(data.password),
      },
    });
    revalidatePath("/employees");
    return { ok: true, data: null };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "A user with this email already exists." };
    }
    throw error;
  }
}

export async function updateEmployee(id: string, input: UpdateEmployeeInput): Promise<ActionResult> {
  const user = await authorize("EDIT");
  if (!user) return { ok: false, error: "You don't have permission to edit employees." };

  const parsed = UpdateEmployeeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form for invalid fields." };
  const data = parsed.data;

  const existing = await db.user.findFirst({ where: { companyId: user.companyId, id } });
  if (!existing) return { ok: false, error: "Employee not found." };

  if (data.roleId && !(await roleBelongsToCompany(user.companyId, data.roleId))) {
    return { ok: false, error: "Selected role is invalid." };
  }

  try {
    await db.user.update({
      where: { id },
      data: {
        ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
        ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
        ...(data.roleId !== undefined ? { roleId: data.roleId } : {}),
        ...(data.branchId !== undefined ? { branchId: data.branchId || null } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.password ? { passwordHash: await hash(data.password) } : {}),
      },
    });
    revalidatePath("/employees");
    return { ok: true, data: null };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "A user with this email already exists." };
    }
    throw error;
  }
}

export async function deleteEmployee(id: string): Promise<ActionResult> {
  const user = await authorize("DELETE");
  if (!user) return { ok: false, error: "You don't have permission to delete employees." };

  if (id === user.id) return { ok: false, error: "You can't delete your own account." };

  const existing = await db.user.findFirst({ where: { companyId: user.companyId, id } });
  if (!existing) return { ok: false, error: "Employee not found." };

  // Assigned salesperson/rider links are optional FKs (set to null on delete); sessions cascade.
  await db.user.delete({ where: { id } });
  revalidatePath("/employees");
  return { ok: true, data: null };
}
