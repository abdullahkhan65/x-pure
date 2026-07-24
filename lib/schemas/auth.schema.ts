import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const CurrentUserSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  branchId: z.string().nullable(),
  roleId: z.string(),
  roleName: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  permissions: z.array(z.string()),
});
export type CurrentUser = z.infer<typeof CurrentUserSchema>;
