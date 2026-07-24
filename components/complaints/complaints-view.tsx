"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ComplaintListItem, ComplaintPriority, ComplaintQuery, ComplaintStatus } from "@/lib/types";
import { permissionCode } from "@/lib/types";
import type { CustomerOption } from "@/lib/customers/queries";
import type { PaginatedComplaints } from "@/lib/complaints/queries";
import { deleteComplaint } from "@/lib/complaints/actions";
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
import { ComplaintFormDialog } from "./complaint-form-dialog";

const STATUS_VARIANT: Record<ComplaintStatus, "secondary" | "warning" | "success" | "destructive"> = {
  OPEN: "secondary",
  ASSIGNED: "warning",
  IN_PROGRESS: "warning",
  RESOLVED: "success",
  CLOSED: "secondary",
  ESCALATED: "destructive",
};
const PRIORITY_VARIANT: Record<ComplaintPriority, "secondary" | "warning" | "destructive"> = {
  LOW: "secondary",
  MEDIUM: "secondary",
  HIGH: "warning",
  URGENT: "destructive",
};

function label(value: string) {
  const text = value.toLowerCase().replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

interface ComplaintsViewProps {
  data: PaginatedComplaints;
  query: ComplaintQuery;
  customers: CustomerOption[];
  staff: { id: string; name: string }[];
}

export function ComplaintsView({ data, query, customers, staff }: ComplaintsViewProps) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ComplaintListItem | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<ComplaintListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const controls = useListControls(startTransition);

  const canCreate = hasPermission(permissionCode("complaints", "CREATE"));
  const canEdit = hasPermission(permissionCode("complaints", "EDIT"));
  const canDelete = hasPermission(permissionCode("complaints", "DELETE"));

  function openCreate() {
    setEditTarget(undefined);
    setFormOpen(true);
  }
  function openEdit(complaint: ComplaintListItem) {
    setEditTarget(complaint);
    setFormOpen(true);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await deleteComplaint(deleteTarget.id);
    setIsDeleting(false);
    if (result.ok) {
      toast.success("Complaint deleted.");
      setDeleteTarget(null);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const columns: ColumnDef<ComplaintListItem>[] = [
    { accessorKey: "createdAt", header: "Logged", cell: ({ row }) => formatDate(row.original.createdAt) },
    {
      accessorKey: "customerName",
      header: "Customer",
      cell: ({ row }) => <span className="font-medium">{row.original.customerName}</span>,
    },
    { accessorKey: "category", header: "Category", cell: ({ row }) => label(row.original.category) },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => <Badge variant={PRIORITY_VARIANT[row.original.priority]}>{label(row.original.priority)}</Badge>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant={STATUS_VARIANT[row.original.status]}>{label(row.original.status)}</Badge>,
    },
    { accessorKey: "assignedToName", header: "Assignee", cell: ({ row }) => row.original.assignedToName ?? "—" },
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
                <Pencil className="mr-2 h-4 w-4" /> Update
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
        title="Complaints"
        description="Log, prioritize, assign, and resolve customer issues."
        actions={
          canCreate ? (
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Log Complaint
            </Button>
          ) : null
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search description or customer..."
          defaultValue={query.search ?? ""}
          onChange={(e) => controls.setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={query.status ?? "all"} onValueChange={(v) => controls.set("status", v === "all" ? undefined : v)}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="ASSIGNED">Assigned</SelectItem>
            <SelectItem value="IN_PROGRESS">In progress</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
            <SelectItem value="ESCALATED">Escalated</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={query.priority ?? "all"}
          onValueChange={(v) => controls.set("priority", v === "all" ? undefined : v)}
        >
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="All priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={data.items} emptyMessage="No complaints match these filters." />

      <Pagination
        page={data.page}
        totalPages={data.totalPages}
        total={data.total}
        noun="complaints"
        onPageChange={(p) => controls.set("page", p > 1 ? String(p) : undefined)}
      />

      <ComplaintFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        complaint={editTarget}
        customers={customers}
        staff={staff}
        onSaved={() => router.refresh()}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete complaint"
        description="This permanently removes the complaint record."
        confirmLabel="Delete"
        destructive
        isConfirming={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
