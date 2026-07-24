import { z } from "zod";
import { PaginationQuerySchema } from "./common.schema";

export const ComplaintCategorySchema = z.enum([
  "LATE_DELIVERY",
  "WRONG_ORDER",
  "DAMAGED_BOTTLE",
  "MISSING_BOTTLE",
  "POOR_SERVICE",
  "LEAKAGE",
  "QUALITY_ISSUE",
  "BILLING_ISSUE",
  "OTHER",
]);
export type ComplaintCategory = z.infer<typeof ComplaintCategorySchema>;

export const ComplaintStatusSchema = z.enum([
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "ESCALATED",
]);
export type ComplaintStatus = z.infer<typeof ComplaintStatusSchema>;

export const ComplaintPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
export type ComplaintPriority = z.infer<typeof ComplaintPrioritySchema>;

export const CreateComplaintSchema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  category: ComplaintCategorySchema,
  priority: ComplaintPrioritySchema.default("MEDIUM"),
  description: z.string().trim().min(1, "Describe the complaint").max(2000),
  assignedToUserId: z.string().optional(),
});
export type CreateComplaintInput = z.infer<typeof CreateComplaintSchema>;

export const UpdateComplaintSchema = z.object({
  status: ComplaintStatusSchema.optional(),
  priority: ComplaintPrioritySchema.optional(),
  assignedToUserId: z.string().optional(),
  resolutionNotes: z.string().trim().max(2000).optional(),
});
export type UpdateComplaintInput = z.infer<typeof UpdateComplaintSchema>;

export const ComplaintQuerySchema = PaginationQuerySchema.extend({
  search: z.string().trim().optional(),
  status: ComplaintStatusSchema.optional(),
  priority: ComplaintPrioritySchema.optional(),
});
export type ComplaintQuery = z.infer<typeof ComplaintQuerySchema>;

export interface ComplaintListItem {
  id: string;
  customerId: string;
  customerName: string;
  category: ComplaintCategory;
  description: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  assignedToName: string | null;
  resolutionNotes: string | null;
  createdAt: string;
}
