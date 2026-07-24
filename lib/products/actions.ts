"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { CreateProductSchema, UpdateProductSchema, permissionCode } from "@/lib/types";
import type { CreateProductInput, ProductResponse, UpdateProductInput } from "@/lib/types";
import { db } from "@/lib/db";
import { getCurrentUser, hasPermission } from "@/lib/auth/session";
import { toResponse } from "./queries";

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };

async function authorize(action: "CREATE" | "EDIT" | "DELETE") {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, permissionCode("products", action))) return null;
  return user;
}

export async function createProduct(input: CreateProductInput): Promise<ActionResult<ProductResponse>> {
  const user = await authorize("CREATE");
  if (!user) return { ok: false, error: "You don't have permission to create products." };

  const parsed = CreateProductSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form for invalid fields." };

  try {
    const product = await db.product.create({ data: { companyId: user.companyId, ...parsed.data } });
    revalidatePath("/products");
    return { ok: true, data: toResponse(product) };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "A product with this SKU already exists." };
    }
    throw error;
  }
}

export async function updateProduct(id: string, input: UpdateProductInput): Promise<ActionResult<ProductResponse>> {
  const user = await authorize("EDIT");
  if (!user) return { ok: false, error: "You don't have permission to edit products." };

  const parsed = UpdateProductSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form for invalid fields." };

  const existing = await db.product.findFirst({ where: { companyId: user.companyId, id } });
  if (!existing) return { ok: false, error: "Product not found." };

  try {
    const product = await db.product.update({ where: { id }, data: parsed.data });
    revalidatePath("/products");
    return { ok: true, data: toResponse(product) };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "A product with this SKU already exists." };
    }
    throw error;
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const user = await authorize("DELETE");
  if (!user) return { ok: false, error: "You don't have permission to delete products." };

  const existing = await db.product.findFirst({ where: { companyId: user.companyId, id } });
  if (!existing) return { ok: false, error: "Product not found." };

  // Products referenced by orders can't be hard-deleted without orphaning line items.
  const usedByOrders = await db.orderItem.count({ where: { productId: id } });
  if (usedByOrders > 0) {
    return { ok: false, error: "This product is used by existing orders. Deactivate it instead of deleting." };
  }

  await db.product.delete({ where: { id } });
  revalidatePath("/products");
  return { ok: true, data: null };
}
