"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { EmployeeQuery, EmployeeResponse, UserStatus } from "@/lib/types";
import { permissionCode } from "@/lib/types";
import type { RoleOption } from "@/lib/employees/queries";
import type { BranchOption } from "@/lib/branches";
import type { PaginatedEmployees } from "@/lib/employees/queries";
import { deleteEmployee } from "@/lib/employees/actions";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/user-context";
import { useListControls } from "@/lib/use-list-controls";
import { EmployeeFormDialog } from "./employee-form-dialog";

const STATUS_VARIANT: Record<UserStatus, "success" | "warning" | "secondary" | "destructive"> = {
  ACTIVE: "success",
  INVITED: "warning",
  SUSPENDED: "destructive",
  DISABLED: "secondary",
};

interface EmployeesViewProps {
  data: PaginatedEmployees;
  query: EmployeeQuery;
  roles: RoleOption[];
  branches: BranchOption[];
}

export function EmployeesView({ data, query, roles, branches }: EmployeesViewProps) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EmployeeResponse | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<EmployeeResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const controls = useListControls(startTransition);

  const canCreate = hasPermission(permissionCode("employees", "CREATE"));
  const canEdit = hasPermission(permissionCode("employees", "EDIT"));
  const canDelete = hasPermission(permissionCode("employees", "DELETE"));

  function openCreate() {
    setEditTarget(undefined);
    setFormOpen(true);
  }
  function openEdit(employee: EmployeeResponse) {
    setEditTarget(employee);
    setFormOpen(true);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await deleteEmployee(deleteTarget.id);
    setIsDeleting(false);
    if (result.ok) {
      toast.success(`${deleteTarget.firstName} ${deleteTarget.lastName} was deleted.`);
      setDeleteTarget(null);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const columns: ColumnDef<EmployeeResponse>[] = [
    {
      accessorKey: "firstName",
      header: "Name",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">
            {row.original.firstName} {row.original.lastName}
          </div>
          <div className="text-xs text-muted-foreground">{row.original.email}</div>
        </div>
      ),
    },
    { accessorKey: "roleName", header: "Role", cell: ({ row }) => <Badge variant="outline">{row.original.roleName}</Badge> },
    { accessorKey: "branchName", header: "Branch", cell: ({ row }) => row.original.branchName ?? "—" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant={STATUS_VARIANT[row.original.status]}>{row.original.status}</Badge>,
    },
    { accessorKey: "lastLoginAt", header: "Last login", cell: ({ row }) => formatDate(row.original.lastLoginAt) },
  ];

  if (canEdit || canDelete) {
    columns.push({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canEdit ? (
              <DropdownMenuItem onClick={() => openEdit(row.original)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
            ) : null}
            {canDelete ? (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteTarget(row.original)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Staff accounts, their roles, and login access."
        actions={
          canCreate ? (
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Add Employee
            </Button>
          ) : null
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search name or email..."
          defaultValue={query.search ?? ""}
          onChange={(e) => controls.setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={query.roleId ?? "all"} onValueChange={(v) => controls.set("roleId", v === "all" ? undefined : v)}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={query.status ?? "all"} onValueChange={(v) => controls.set("status", v === "all" ? undefined : v)}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INVITED">Invited</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
            <SelectItem value="DISABLED">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={data.items} emptyMessage="No employees match these filters." />

      <Pagination
        page={data.page}
        totalPages={data.totalPages}
        total={data.total}
        noun="employees"
        onPageChange={(p) => controls.set("page", p > 1 ? String(p) : undefined)}
      />

      <EmployeeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        employee={editTarget}
        roles={roles}
        branches={branches}
        onSaved={() => router.refresh()}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete employee"
        description={`This removes ${deleteTarget ? `${deleteTarget.firstName} ${deleteTarget.lastName}` : "this employee"} and revokes their access.`}
        confirmLabel="Delete"
        destructive
        isConfirming={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
