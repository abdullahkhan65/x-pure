import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { EmployeeQuery, EmployeeResponse } from "@/lib/types";

export interface PaginatedEmployees {
  items: EmployeeResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function listEmployees(companyId: string, query: EmployeeQuery): Promise<PaginatedEmployees> {
  const where: Prisma.UserWhereInput = {
    companyId,
    ...(query.roleId ? { roleId: query.roleId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { firstName: { contains: query.search, mode: "insensitive" } },
            { lastName: { contains: query.search, mode: "insensitive" } },
            { email: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { role: { select: { name: true } }, branch: { select: { name: true } } },
    }),
    db.user.count({ where }),
  ]);

  return {
    items: items.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      roleId: user.roleId,
      roleName: user.role.name,
      branchId: user.branchId,
      branchName: user.branch?.name ?? null,
      status: user.status,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    })),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(Math.ceil(total / query.pageSize), 1),
  };
}

export interface RoleOption {
  id: string;
  name: string;
}

export async function listRoleOptions(companyId: string): Promise<RoleOption[]> {
  const roles = await db.role.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return roles;
}

/** Staff who can be assigned as salesperson/rider — for order and customer selectors. */
export async function listStaffOptions(companyId: string): Promise<{ id: string; name: string }[]> {
  const staff = await db.user.findMany({
    where: { companyId, status: "ACTIVE" },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    select: { id: true, firstName: true, lastName: true },
  });
  return staff.map((s) => ({ id: s.id, name: `${s.firstName} ${s.lastName}` }));
}
