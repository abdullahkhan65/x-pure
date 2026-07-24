"use server";

import { verify } from "@node-rs/argon2";
import { LoginSchema, type LoginInput } from "@/lib/types";
import { db } from "@/lib/db";
import { createSession, destroySession } from "./session";

export async function login(input: LoginInput): Promise<{ error: string } | { ok: true }> {
  const parsed = LoginSchema.safeParse(input);
  if (!parsed.success) return { error: "Enter a valid email and password." };
  const { email, password } = parsed.data;

  // Single company exists today; a real multi-tenant login would resolve the company
  // from the request (subdomain/slug) instead of grabbing "the" company.
  const company = await db.company.findFirst();
  const user = company
    ? await db.user.findUnique({ where: { companyId_email: { companyId: company.id, email } } })
    : null;

  if (!user || user.status !== "ACTIVE" || !(await verify(user.passwordHash, password))) {
    return { error: "Invalid email or password" };
  }

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession(user.id);
  return { ok: true };
}

export async function logout(): Promise<void> {
  await destroySession();
}
