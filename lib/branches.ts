import { db } from "@/lib/db";

export interface BranchOption {
  id: string;
  name: string;
}

export async function listBranchOptions(companyId: string): Promise<BranchOption[]> {
  const branches = await db.branch.findMany({
    where: { companyId, isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return branches;
}
