import { z } from "zod";
import { PaginationQuerySchema } from "./common.schema";

export const UserStatusSchema = z.enum(["ACTIVE", "INVITED", "SUSPENDED", "DISABLED"]);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const CreateEmployeeSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  email: z.string().trim().email(),
  phone: z.string().trim().max(30).optional(),
  roleId: z.string().min(1, "Select a role"),
  branchId: z.string().optional(),
  status: UserStatusSchema.default("ACTIVE"),
  password: z.string().min(8, "At least 8 characters"),
});
export type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>;

// Edit reuses the create shape but the password is optional (blank = keep current).
export const UpdateEmployeeSchema = CreateEmployeeSchema.extend({
  password: z.string().min(8).optional().or(z.literal("").transform(() => undefined)),
}).partial();
export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeSchema>;

export const EmployeeQuerySchema = PaginationQuerySchema.extend({
  search: z.string().trim().optional(),
  roleId: z.string().optional(),
  status: UserStatusSchema.optional(),
});
export type EmployeeQuery = z.infer<typeof EmployeeQuerySchema>;

export const EmployeeResponseSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  roleId: z.string(),
  roleName: z.string(),
  branchId: z.string().nullable(),
  branchName: z.string().nullable(),
  status: UserStatusSchema,
  lastLoginAt: z.string().nullable(),
  createdAt: z.string(),
});
export type EmployeeResponse = z.infer<typeof EmployeeResponseSchema>;
