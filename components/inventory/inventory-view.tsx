"use client";

import { useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Boxes, Droplet, PackageCheck } from "lucide-react";
import type { ProductQuery } from "@/lib/types";
import type { InventoryRow, InventorySummary, PaginatedInventory } from "@/lib/inventory/queries";
import { formatCurrency } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListControls } from "@/lib/use-list-controls";

interface InventoryViewProps {
  data: PaginatedInventory;
  query: ProductQuery;
  summary: InventorySummary;
}

export function InventoryView({ data, query, summary }: InventoryViewProps) {
  const [, startTransition] = useTransition();
  const controls = useListControls(startTransition);

  const columns: ColumnDef<InventoryRow>[] = [
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.sku}</span>,
    },
    { accessorKey: "name", header: "Product", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { accessorKey: "unit", header: "Unit", cell: ({ row }) => <Badge variant="outline">{row.original.unit}</Badge> },
    { accessorKey: "unitPrice", header: "Price", cell: ({ row }) => formatCurrency(row.original.unitPrice) },
    { accessorKey: "unitsSold", header: "Units sold", cell: ({ row }) => row.original.unitsSold },
    { accessorKey: "revenue", header: "Revenue", cell: ({ row }) => formatCurrency(row.original.revenue) },
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

  const cards = [
    { label: "Total SKUs", value: String(summary.totalSkus), icon: Boxes },
    { label: "Active SKUs", value: String(summary.activeSkus), icon: PackageCheck },
    { label: "Bottles in Circulation", value: String(summary.bottlesInCirculation), icon: Droplet },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Product catalog with sales performance and bottle circulation. Manage the catalog itself under Products; bottle movements under Bottle Security."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>{card.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search name or SKU..."
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

      <DataTable columns={columns} data={data.items} emptyMessage="No products found." />

      <Pagination
        page={data.page}
        totalPages={data.totalPages}
        total={data.total}
        noun="products"
        onPageChange={(p) => controls.set("page", p > 1 ? String(p) : undefined)}
      />
    </div>
  );
}
