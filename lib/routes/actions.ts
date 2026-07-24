"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { CreateRouteSchema, UpdateRouteSchema, permissionCode } from "@/lib/types";
import type { CreateRouteInput, UpdateRouteInput } from "@/lib/types";
import { db } from "@/lib/db";
import { getCurrentUser, hasPermission } from "@/lib/auth/session";

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };

async function authorize(action: "CREATE" | "EDIT" | "DELETE") {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, permissionCode("routes", action))) return null;
  return user;
}

function normalize(input: CreateRouteInput | UpdateRouteInput) {
  return { ...input, branchId: input.branchId ? input.branchId : null };
}

export async function createRoute(input: CreateRouteInput): Promise<ActionResult> {
  const user = await authorize("CREATE");
  if (!user) return { ok: false, error: "You don't have permission to create routes." };

  const parsed = CreateRouteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form for invalid fields." };

  try {
    await db.deliveryRoute.create({ data: { companyId: user.companyId, ...normalize(parsed.data) } });
    revalidatePath("/routes");
    return { ok: true, data: null };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "A route with this code already exists." };
    }
    throw error;
  }
}

export async function updateRoute(id: string, input: UpdateRouteInput): Promise<ActionResult> {
  const user = await authorize("EDIT");
  if (!user) return { ok: false, error: "You don't have permission to edit routes." };

  const parsed = UpdateRouteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form for invalid fields." };

  const existing = await db.deliveryRoute.findFirst({ where: { companyId: user.companyId, id } });
  if (!existing) return { ok: false, error: "Route not found." };

  try {
    await db.deliveryRoute.update({ where: { id }, data: normalize(parsed.data) });
    revalidatePath("/routes");
    return { ok: true, data: null };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "A route with this code already exists." };
    }
    throw error;
  }
}

export async function deleteRoute(id: string): Promise<ActionResult> {
  const user = await authorize("DELETE");
  if (!user) return { ok: false, error: "You don't have permission to delete routes." };

  const existing = await db.deliveryRoute.findFirst({ where: { companyId: user.companyId, id } });
  if (!existing) return { ok: false, error: "Route not found." };

  const inUse = await db.customer.count({ where: { assignedRouteId: id } });
  if (inUse > 0) {
    return { ok: false, error: "This route has customers assigned. Reassign them before deleting." };
  }

  await db.deliveryRoute.delete({ where: { id } });
  revalidatePath("/routes");
  return { ok: true, data: null };
}
