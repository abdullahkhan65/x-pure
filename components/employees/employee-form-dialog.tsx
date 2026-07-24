"use client";

import { useEffect, useMemo } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { UserStatusSchema, type CreateEmployeeInput, type EmployeeResponse, type UserStatus } from "@/lib/types";
import type { RoleOption } from "@/lib/employees/queries";
import type { BranchOption } from "@/lib/branches";
import { createEmployee, updateEmployee } from "@/lib/employees/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface EmployeeFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roleId: string;
  branchId?: string;
  status: UserStatus;
  password?: string;
}

interface EmployeeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: EmployeeResponse;
  roles: RoleOption[];
  branches: BranchOption[];
  onSaved: () => void;
}

const NO_BRANCH = "__none__";
const STATUSES: UserStatus[] = ["ACTIVE", "INVITED", "SUSPENDED", "DISABLED"];

const EMPTY: EmployeeFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  roleId: "",
  status: "ACTIVE",
  password: "",
};

export function EmployeeFormDialog({ open, onOpenChange, employee, roles, branches, onSaved }: EmployeeFormDialogProps) {
  const isEdit = !!employee;

  const schema = useMemo(
    () =>
      z.object({
        firstName: z.string().trim().min(1).max(60),
        lastName: z.string().trim().min(1).max(60),
        email: z.string().trim().email(),
        phone: z.string().trim().max(30).optional(),
        roleId: z.string().min(1, "Select a role"),
        branchId: z.string().optional(),
        status: UserStatusSchema,
        password: isEdit
          ? z.string().min(8, "At least 8 characters").optional().or(z.literal(""))
          : z.string().min(8, "At least 8 characters"),
      }),
    [isEdit],
  );

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(schema) as Resolver<EmployeeFormValues>,
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      employee
        ? {
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            phone: employee.phone ?? undefined,
            roleId: employee.roleId,
            branchId: employee.branchId ?? undefined,
            status: employee.status,
            password: "",
          }
        : EMPTY,
    );
  }, [open, employee, form]);

  async function onSubmit(values: EmployeeFormValues) {
    const result = employee
      ? await updateEmployee(employee.id, values)
      : await createEmployee(values as CreateEmployeeInput);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(employee ? "Employee updated." : "Employee added.");
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{employee ? "Edit employee" : "Add employee"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
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
                name="branchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch</FormLabel>
                    <Select
                      value={field.value ?? NO_BRANCH}
                      onValueChange={(v) => field.onChange(v === NO_BRANCH ? undefined : v)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="No branch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NO_BRANCH}>No branch</SelectItem>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
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
                        {STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isEdit ? "New password" : "Password"}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        placeholder={isEdit ? "Leave blank to keep current" : ""}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : employee ? "Save changes" : "Add employee"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
