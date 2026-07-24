"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { RouteQuery, RouteResponse } from "@/lib/types";
import { permissionCode } from "@/lib/types";
import type { BranchOption } from "@/lib/branches";
import type { PaginatedRoutes } from "@/lib/routes/queries";
import { deleteRoute } from "@/lib/routes/actions";
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
import { RouteFormDialog } from "./route-form-dialog";

interface RoutesViewProps {
  data: PaginatedRoutes;
  query: RouteQuery;
  branches: BranchOption[];
}

export function RoutesView({ data, query, branches }: RoutesViewProps) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RouteResponse | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<RouteResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const controls = useListControls(startTransition);

  const canCreate = hasPermission(permissionCode("routes", "CREATE"));
  const canEdit = hasPermission(permissionCode("routes", "EDIT"));
  const canDelete = hasPermission(permissionCode("routes", "DELETE"));

  function openCreate() {
    setEditTarget(undefined);
    setFormOpen(true);
  }
  function openEdit(route: RouteResponse) {
    setEditTarget(route);
    setFormOpen(true);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await deleteRoute(deleteTarget.id);
    setIsDeleting(false);
    if (result.ok) {
      toast.success(`${deleteTarget.name} was deleted.`);
      setDeleteTarget(null);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const columns: ColumnDef<RouteResponse>[] = [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.code}</span>,
    },
    { accessorKey: "name", header: "Name", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { accessorKey: "branchName", header: "Branch", cell: ({ row }) => row.original.branchName ?? "—" },
    { accessorKey: "customerCount", header: "Customers", cell: ({ row }) => row.original.customerCount },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "success" : "secondary"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
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
        title="Routes"
        description="Delivery routes riders follow, and the customers assigned to each."
        actions={
          canCreate ? (
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> New Route
            </Button>
          ) : null
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search name or code..."
          defaultValue={query.search ?? ""}
          onChange={(e) => controls.setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select
          value={query.isActive ?? "all"}
          onValueChange={(v) => controls.set("isActive", v === "all" ? undefined : v)}
        >
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={data.items} emptyMessage="No routes match these filters." />

      <Pagination
        page={data.page}
        totalPages={data.totalPages}
        total={data.total}
        noun="routes"
        onPageChange={(p) => controls.set("page", p > 1 ? String(p) : undefined)}
      />

      <RouteFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        route={editTarget}
        branches={branches}
        onSaved={() => router.refresh()}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete route"
        description={`This permanently removes ${deleteTarget?.name ?? "this route"}.`}
        confirmLabel="Delete"
        destructive
        isConfirming={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
