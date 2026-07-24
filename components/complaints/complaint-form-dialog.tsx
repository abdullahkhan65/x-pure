"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ComplaintCategorySchema,
  ComplaintPrioritySchema,
  ComplaintStatusSchema,
  type ComplaintCategory,
  type ComplaintListItem,
  type ComplaintPriority,
  type ComplaintStatus,
} from "@/lib/types";
import type { CustomerOption } from "@/lib/customers/queries";
import { createComplaint, updateComplaint } from "@/lib/complaints/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const CATEGORIES: ComplaintCategory[] = [
  "LATE_DELIVERY",
  "WRONG_ORDER",
  "DAMAGED_BOTTLE",
  "MISSING_BOTTLE",
  "POOR_SERVICE",
  "LEAKAGE",
  "QUALITY_ISSUE",
  "BILLING_ISSUE",
  "OTHER",
];
const STATUSES: ComplaintStatus[] = ["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED", "ESCALATED"];
const PRIORITIES: ComplaintPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const NONE = "__none__";

function label(value: string) {
  const text = value.toLowerCase().replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const FormSchema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  category: ComplaintCategorySchema,
  priority: ComplaintPrioritySchema,
  description: z.string().trim().min(1, "Describe the complaint").max(2000),
  assignedToUserId: z.string().optional(),
  status: ComplaintStatusSchema,
  resolutionNotes: z.string().trim().max(2000).optional(),
});
type FormValues = z.infer<typeof FormSchema>;

interface ComplaintFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  complaint?: ComplaintListItem;
  customers: CustomerOption[];
  staff: { id: string; name: string }[];
  onSaved: () => void;
}

const EMPTY: FormValues = {
  customerId: "",
  category: "OTHER",
  priority: "MEDIUM",
  description: "",
  status: "OPEN",
};

export function ComplaintFormDialog({
  open,
  onOpenChange,
  complaint,
  customers,
  staff,
  onSaved,
}: ComplaintFormDialogProps) {
  const isEdit = !!complaint;
  const form = useForm<FormValues>({ resolver: zodResolver(FormSchema), defaultValues: EMPTY });

  useEffect(() => {
    if (!open) return;
    form.reset(
      complaint
        ? {
            customerId: complaint.customerId,
            category: complaint.category,
            priority: complaint.priority,
            description: complaint.description,
            assignedToUserId: undefined,
            status: complaint.status,
            resolutionNotes: complaint.resolutionNotes ?? undefined,
          }
        : EMPTY,
    );
    // assignee id isn't in the list row; leave the select unset on edit unless reassigning.
  }, [open, complaint, form]);

  async function onSubmit(values: FormValues) {
    const result = complaint
      ? await updateComplaint(complaint.id, {
          status: values.status,
          priority: values.priority,
          assignedToUserId: values.assignedToUserId,
          resolutionNotes: values.resolutionNotes,
        })
      : await createComplaint({
          customerId: values.customerId,
          category: values.category,
          priority: values.priority,
          description: values.description,
          assignedToUserId: values.assignedToUserId,
        });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(complaint ? "Complaint updated." : "Complaint logged.");
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{complaint ? "Update complaint" : "Log complaint"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isEdit}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={isEdit}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {label(c)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {label(p)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isEdit ? (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {label(s)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
              <FormField
                control={form.control}
                name="assignedToUserId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign to</FormLabel>
                    <Select value={field.value ?? NONE} onValueChange={(v) => field.onChange(v === NONE ? undefined : v)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE}>Unassigned</SelectItem>
                        {staff.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} disabled={isEdit} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEdit ? (
              <FormField
                control={form.control}
                name="resolutionNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resolution notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : complaint ? "Save changes" : "Log complaint"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
