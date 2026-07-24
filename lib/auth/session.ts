import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import type { CurrentUser } from "@/lib/types";
import { db } from "@/lib/db";

/**
 * Cookie sessions backed by the refresh_tokens table (kept from the original schema so no
 * migration is needed): the cookie holds a random token, the DB stores its sha256 hash.
 */
const SESSION_COOKIE = "session";
const SESSION_TTL_DAYS = 30;

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const raw = randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await db.refreshToken.create({
    data: { userId, tokenHash: hashToken(raw), expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, raw, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (raw) {
    await db.refreshToken.updateMany({
      where: { tokenHash: hashToken(raw), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  cookieStore.delete(SESSION_COOKIE);
}

/** Resolve the signed-in user (with role + permission codes). Cached per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const record = await db.refreshToken.findUnique({
    where: { tokenHash: hashToken(raw) },
    include: {
      user: {
        include: {
          role: { include: { rolePermissions: { include: { permission: true } } } },
        },
      },
    },
  });

  if (!record || record.revokedAt || record.expiresAt < new Date()) return null;
  if (record.user.status !== "ACTIVE") return null;

  const { user } = record;
  return {
    id: user.id,
    companyId: user.companyId,
    branchId: user.branchId,
    roleId: user.roleId,
    roleName: user.role.name,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    permissions: user.role.rolePermissions.map((rp) => rp.permission.code),
  };
});

export function hasPermission(user: Pick<CurrentUser, "permissions">, code: string): boolean {
  return user.permissions.includes(code);
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Sends users without the permission back home — the nav already hides these pages. */
export async function requirePermission(code: string): Promise<CurrentUser> {
  const user = await requireUser();
  if (!hasPermission(user, code)) redirect("/");
  return user;
}
