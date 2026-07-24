"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Droplet, Plus, Wallet } from "lucide-react";
import type { BottleBalanceRow, BottleQuery, BottleTotals } from "@/lib/types";
import { permissionCode } from "@/lib/types";
import type { CustomerOption } from "@/lib/customers/queries";
import type { PaginatedBalances } from "@/lib/bottles/queries";
import { formatCurrency } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/user-context";
import { useListControls } from "@/lib/use-list-controls";
import { BottleEntryDialog } from "./bottle-entry-dialog";

interface BottleSecurityViewProps {
  data: PaginatedBalances;
  query: BottleQuery;
  totals: BottleTotals;
  customers: CustomerOption[];
}

export function BottleSecurityView({ data, query, totals, customers }: BottleSecurityViewProps) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const controls = useListControls(startTransition);

  const canCreate = hasPermission(permissionCode("bottle_security", "CREATE"));

  const columns: ColumnDef<BottleBalanceRow>[] = [
    {
      accessorKey: "customerCode",
      header: "Code",
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.customerCode}</span>,
    },
    {
      accessorKey: "customerName",
      header: "Customer",
      cell: ({ row }) => (
        <Link href={`/customers/${row.original.customerId}`} className="font-medium hover:underline">
          {row.original.customerName}
        </Link>
      ),
    },
    {
      accessorKey: "bottlesHeld",
      header: "Bottles held",
      cell: ({ row }) => <span className="font-medium">{row.original.bottlesHeld}</span>,
    },
    {
      accessorKey: "depositBalance",
      header: "Deposit balance",
      cell: ({ row }) => formatCurrency(row.original.depositBalance),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bottle Security"
        description="Bottles held by customers and the deposits securing them."
        actions={
          canCreate ? (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Record Entry
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Bottles Out</CardTitle>
            <Droplet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totals.bottlesOut}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Deposits Held</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatCurrency(totals.depositsHeld)}</div>
          </CardContent>
        </Card>
      </div>

      <Input
        placeholder="Search customer name, code, or phone..."
        defaultValue={query.search ?? ""}
        onChange={(e) => controls.setSearch(e.target.value)}
        className="sm:max-w-sm"
      />

      <DataTable columns={columns} data={data.items} emptyMessage="No customers found." />

      <Pagination
        page={data.page}
        totalPages={data.totalPages}
        total={data.total}
        noun="customers"
        onPageChange={(p) => controls.set("page", p > 1 ? String(p) : undefined)}
      />

      <BottleEntryDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        customers={customers}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
