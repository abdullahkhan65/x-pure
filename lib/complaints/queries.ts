import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { ComplaintListItem, ComplaintQuery } from "@/lib/types";

export interface PaginatedComplaints {
  items: ComplaintListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function listComplaints(companyId: string, query: ComplaintQuery): Promise<PaginatedComplaints> {
  const where: Prisma.ComplaintWhereInput = {
    companyId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.priority ? { priority: query.priority } : {}),
    ...(query.search
      ? {
          OR: [
            { description: { contains: query.search, mode: "insensitive" } },
            { customer: { name: { contains: query.search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    db.complaint.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { customer: { select: { name: true } } },
    }),
    db.complaint.count({ where }),
  ]);

  // assignedToUserId has no Prisma relation on Complaint, so resolve names in one extra query.
  const assigneeIds = [...new Set(items.map((c) => c.assignedToUserId).filter((id): id is string => !!id))];
  const assignees = assigneeIds.length
    ? await db.user.findMany({
        where: { id: { in: assigneeIds } },
        select: { id: true, firstName: true, lastName: true },
      })
    : [];
  const nameById = new Map(assignees.map((u) => [u.id, `${u.firstName} ${u.lastName}`]));

  return {
    items: items.map((complaint) => ({
      id: complaint.id,
      customerId: complaint.customerId,
      customerName: complaint.customer.name,
      category: complaint.category,
      description: complaint.description,
      status: complaint.status,
      priority: complaint.priority,
      assignedToName: complaint.assignedToUserId ? (nameById.get(complaint.assignedToUserId) ?? null) : null,
      resolutionNotes: complaint.resolutionNotes,
      createdAt: complaint.createdAt.toISOString(),
    })),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(Math.ceil(total / query.pageSize), 1),
  };
}
