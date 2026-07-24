"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { UpdateCompanySchema, type BranchRow, type CompanyProfile, type UpdateCompanyInput } from "@/lib/types";
import { updateCompany, deleteBranch } from "@/lib/settings/actions";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BranchFormDialog } from "./branch-form-dialog";

interface SettingsViewProps {
  company: CompanyProfile;
  branches: BranchRow[];
  canEdit: boolean;
}

export function SettingsView({ company, branches, canEdit }: SettingsViewProps) {
  const router = useRouter();
  const [branchFormOpen, setBranchFormOpen] = useState(false);
  const [editBranch, setEditBranch] = useState<BranchRow | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<BranchRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<UpdateCompanyInput>({
    resolver: zodResolver(UpdateCompanySchema),
    defaultValues: { name: company.name, timezone: company.timezone, currency: company.currency },
  });

  async function onCompanySubmit(values: UpdateCompanyInput) {
    const result = await updateCompany(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Company settings saved.");
    router.refresh();
  }

  function openCreateBranch() {
    setEditBranch(undefined);
    setBranchFormOpen(true);
  }
  function openEditBranch(branch: BranchRow) {
    setEditBranch(branch);
    setBranchFormOpen(true);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await deleteBranch(deleteTarget.id);
    setIsDeleting(false);
    if (result.ok) {
      toast.success(`${deleteTarget.name} was deleted.`);
      setDeleteTarget(null);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Company profile and branch locations." />

      <Card>
        <CardHeader>
          <CardTitle>Company</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onCompanySubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-3">
                      <FormLabel>Company name</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!canEdit} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!canEdit} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!canEdit} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {canEdit ? (
                <div className="flex justify-end">
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              ) : null}
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Branches</CardTitle>
          {canEdit ? (
            <Button size="sm" onClick={openCreateBranch}>
              <Plus className="mr-2 h-4 w-4" /> New Branch
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                {canEdit ? <TableHead /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.length ? (
                branches.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{branch.code}</TableCell>
                    <TableCell className="font-medium">{branch.name}</TableCell>
                    <TableCell>{branch.phone ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={branch.isActive ? "success" : "secondary"}>
                        {branch.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    {canEdit ? (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditBranch(branch)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget(branch)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={canEdit ? 5 : 4} className="h-20 text-center text-muted-foreground">
                    No branches yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <BranchFormDialog
        open={branchFormOpen}
        onOpenChange={setBranchFormOpen}
        branch={editBranch}
        onSaved={() => router.refresh()}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete branch"
        description={`This permanently removes ${deleteTarget?.name ?? "this branch"}.`}
        confirmLabel="Delete"
        destructive
        isConfirming={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
