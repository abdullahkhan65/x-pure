"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import type { OrderListItem, OrderQuery } from "@/lib/types";
import { permissionCode } from "@/lib/types";
import type { PaginatedOrders } from "@/lib/orders/queries";
import { formatCurrency, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth/user-context";
import { useListControls } from "@/lib/use-list-controls";
import { OrderStatusBadge, PaymentStatusBadge } from "./status-badges";

const STATUSES = ["PENDING", "ASSIGNED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "FAILED"] as const;

export function OrdersView({ data, query }: { data: PaginatedOrders; query: OrderQuery }) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [, startTransition] = useTransition();
  const controls = useListControls(startTransition);

  const canCreate = hasPermission(permissionCode("orders", "CREATE"));

  const columns: ColumnDef<OrderListItem>[] = [
    {
      accessorKey: "orderNumber",
      header: "Order",
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.orderNumber}</span>,
    },
    {
      accessorKey: "customerName",
      header: "Customer",
      cell: ({ row }) => <span className="font-medium">{row.original.customerName}</span>,
    },
    { accessorKey: "itemCount", header: "Items", cell: ({ row }) => row.original.itemCount },
    { accessorKey: "total", header: "Total", cell: ({ row }) => formatCurrency(row.original.total) },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <OrderStatusBadge status={row.original.status} /> },
    {
      accessorKey: "paymentStatus",
      header: "Payment",
      cell: ({ row }) => <PaymentStatusBadge status={row.original.paymentStatus} />,
    },
    { accessorKey: "orderDate", header: "Date", cell: ({ row }) => formatDate(row.original.orderDate) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Create, assign, and track deliveries from pending through delivered."
        actions={
          canCreate ? (
            <Button onClick={() => router.push("/orders/new")}>
              <Plus className="mr-2 h-4 w-4" /> New Order
            </Button>
          ) : null
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search order # or customer..."
          defaultValue={query.search ?? ""}
          onChange={(e) => controls.setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={query.status ?? "all"} onValueChange={(v) => controls.set("status", v === "all" ? undefined : v)}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={query.paymentStatus ?? "all"}
          onValueChange={(v) => controls.set("paymentStatus", v === "all" ? undefined : v)}
        >
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="All payments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payments</SelectItem>
            <SelectItem value="UNPAID">Unpaid</SelectItem>
            <SelectItem value="PARTIAL">Partial</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data.items}
        emptyMessage="No orders match these filters."
        onRowClick={(row) => router.push(`/orders/${row.id}`)}
      />

      <Pagination
        page={data.page}
        totalPages={data.totalPages}
        total={data.total}
        noun="orders"
        onPageChange={(p) => controls.set("page", p > 1 ? String(p) : undefined)}
      />
    </div>
  );
}
