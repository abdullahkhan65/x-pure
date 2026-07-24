import { db } from "@/lib/db";
import type { BranchRow, CompanyProfile } from "@/lib/types";

export async function getCompanyProfile(companyId: string): Promise<CompanyProfile | null> {
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { id: true, name: true, slug: true, timezone: true, currency: true },
  });
  return company;
}

export async function listBranches(companyId: string): Promise<BranchRow[]> {
  const branches = await db.branch.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, code: true, address: true, phone: true, isActive: true },
  });
  return branches;
}
