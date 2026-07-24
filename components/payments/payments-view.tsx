"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Plus } from "lucide-react";
import type { PaymentListItem, PaymentQuery, PaymentTxnStatus } from "@/lib/types";
import { permissionCode } from "@/lib/types";
import type { CustomerOption } from "@/lib/customers/queries";
import type { OpenOrderOption, PaginatedPayments } from "@/lib/payments/queries";
import { formatCurrency, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/user-context";
import { useListControls } from "@/lib/use-list-controls";
import { PaymentFormDialog } from "./payment-form-dialog";

const STATUS_VARIANT: Record<PaymentTxnStatus, "success" | "warning" | "destructive" | "secondary"> = {
  COMPLETED: "success",
  PENDING: "warning",
  FAILED: "destructive",
  REFUNDED: "secondary",
};

interface PaymentsViewProps {
  data: PaginatedPayments;
  query: PaymentQuery;
  customers: CustomerOption[];
  openOrders: OpenOrderOption[];
}

export function PaymentsView({ data, query, customers, openOrders }: PaymentsViewProps) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PaymentListItem | undefined>();
  const controls = useListControls(startTransition);

  const canCreate = hasPermission(permissionCode("payments", "CREATE"));
  const canEdit = hasPermission(permissionCode("payments", "EDIT"));

  function openCreate() {
    setEditTarget(undefined);
    setFormOpen(true);
  }
  function openEdit(payment: PaymentListItem) {
    setEditTarget(payment);
    setFormOpen(true);
  }

  const columns: ColumnDef<PaymentListItem>[] = [
    { accessorKey: "paidAt", header: "Date", cell: ({ row }) => formatDate(row.original.paidAt) },
    {
      accessorKey: "customerName",
      header: "Customer",
      cell: ({ row }) => <span className="font-medium">{row.original.customerName}</span>,
    },
    {
      accessorKey: "orderNumber",
      header: "Order",
      cell: ({ row }) =>
        row.original.orderNumber ? (
          <span className="font-mono text-xs text-muted-foreground">{row.original.orderNumber}</span>
        ) : (
          "—"
        ),
    },
    { accessorKey: "amount", header: "Amount", cell: ({ row }) => formatCurrency(row.original.amount) },
    { accessorKey: "method", header: "Method", cell: ({ row }) => row.original.method.replace(/_/g, " ") },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant={STATUS_VARIANT[row.original.status]}>{row.original.status}</Badge>,
    },
  ];

  if (canEdit) {
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
            <DropdownMenuItem onClick={() => openEdit(row.original)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Money received from customers, against orders or on account."
        actions={
          canCreate ? (
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Record Payment
            </Button>
          ) : null
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search customer, order, reference..."
          defaultValue={query.search ?? ""}
          onChange={(e) => controls.setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={query.method ?? "all"} onValueChange={(v) => controls.set("method", v === "all" ? undefined : v)}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="All methods" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All methods</SelectItem>
            <SelectItem value="CASH">Cash</SelectItem>
            <SelectItem value="BANK_TRANSFER">Bank transfer</SelectItem>
            <SelectItem value="EASYPAISA">Easypaisa</SelectItem>
            <SelectItem value="JAZZCASH">JazzCash</SelectItem>
            <SelectItem value="CARD">Card</SelectItem>
            <SelectItem value="CREDIT">Credit</SelectItem>
            <SelectItem value="CHEQUE">Cheque</SelectItem>
          </SelectContent>
        </Select>
        <Select value={query.status ?? "all"} onValueChange={(v) => controls.set("status", v === "all" ? undefined : v)}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={data.items} emptyMessage="No payments match these filters." />

      <Pagination
        page={data.page}
        totalPages={data.totalPages}
        total={data.total}
        noun="payments"
        onPageChange={(p) => controls.set("page", p > 1 ? String(p) : undefined)}
      />

      <PaymentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        payment={editTarget}
        customers={customers}
        openOrders={openOrders}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
