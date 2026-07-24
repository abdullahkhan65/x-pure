import { z } from "zod";
import { PaginationQuerySchema } from "./common.schema";

export const CreateRouteSchema = z.object({
  name: z.string().trim().min(1).max(120),
  code: z.string().trim().min(1).max(30),
  branchId: z.string().optional(),
  isActive: z.boolean().default(true),
});
export type CreateRouteInput = z.infer<typeof CreateRouteSchema>;

export const UpdateRouteSchema = CreateRouteSchema.partial();
export type UpdateRouteInput = z.infer<typeof UpdateRouteSchema>;

export const RouteQuerySchema = PaginationQuerySchema.extend({
  search: z.string().trim().optional(),
  isActive: z.enum(["true", "false"]).optional(),
});
export type RouteQuery = z.infer<typeof RouteQuerySchema>;

export const RouteResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  branchId: z.string().nullable(),
  branchName: z.string().nullable(),
  isActive: z.boolean(),
  customerCount: z.number().int(),
  createdAt: z.string(),
});
export type RouteResponse = z.infer<typeof RouteResponseSchema>;
