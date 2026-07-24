import { z } from "zod";

export const UpdateCompanySchema = z.object({
  name: z.string().trim().min(1).max(120),
  timezone: z.string().trim().min(1).max(60),
  currency: z.string().trim().min(1).max(10),
});
export type UpdateCompanyInput = z.infer<typeof UpdateCompanySchema>;

export const CreateBranchSchema = z.object({
  name: z.string().trim().min(1).max(120),
  code: z.string().trim().min(1).max(30),
  address: z.string().trim().max(300).optional(),
  phone: z.string().trim().max(30).optional(),
  isActive: z.boolean().default(true),
});
export type CreateBranchInput = z.infer<typeof CreateBranchSchema>;

export const UpdateBranchSchema = CreateBranchSchema.partial();
export type UpdateBranchInput = z.infer<typeof UpdateBranchSchema>;

export interface CompanyProfile {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  currency: string;
}

export interface BranchRow {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
}
