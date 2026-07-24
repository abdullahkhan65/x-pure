"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ProductQuery, ProductResponse } from "@/lib/types";
import { permissionCode } from "@/lib/types";
import type { PaginatedProducts } from "@/lib/products/queries";
import { deleteProduct } from "@/lib/products/actions";
import { formatCurrency } from "@/lib/format";
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
import { ProductFormDialog } from "./product-form-dialog";

export function ProductsView({ data, query }: { data: PaginatedProducts; query: ProductQuery }) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ProductResponse | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<ProductResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const controls = useListControls(startTransition);

  const canCreate = hasPermission(permissionCode("products", "CREATE"));
  const canEdit = hasPermission(permissionCode("products", "EDIT"));
  const canDelete = hasPermission(permissionCode("products", "DELETE"));

  function openCreate() {
    setEditTarget(undefined);
    setFormOpen(true);
  }
  function openEdit(product: ProductResponse) {
    setEditTarget(product);
    setFormOpen(true);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await deleteProduct(deleteTarget.id);
    setIsDeleting(false);
    if (result.ok) {
      toast.success(`${deleteTarget.name} was deleted.`);
      setDeleteTarget(null);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const columns: ColumnDef<ProductResponse>[] = [
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.sku}</span>,
    },
    { accessorKey: "name", header: "Name", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    {
      accessorKey: "unit",
      header: "Unit",
      cell: ({ row }) => <Badge variant="outline">{row.original.unit}</Badge>,
    },
    { accessorKey: "unitPrice", header: "Price", cell: ({ row }) => formatCurrency(row.original.unitPrice) },
    {
      accessorKey: "depositAmount",
      header: "Deposit",
      cell: ({ row }) => (row.original.depositAmount ? formatCurrency(row.original.depositAmount) : "—"),
    },
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
        title="Products"
        description="Bottles, dispensers, and other items you sell or lend."
        actions={
          canCreate ? (
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> New Product
            </Button>
          ) : null
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search name or SKU..."
          defaultValue={query.search ?? ""}
          onChange={(e) => controls.setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select
          value={query.unit ?? "all"}
          onValueChange={(v) => controls.set("unit", v === "all" ? undefined : v)}
        >
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="All units" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All units</SelectItem>
            <SelectItem value="BOTTLE">Bottle</SelectItem>
            <SelectItem value="ITEM">Item</SelectItem>
          </SelectContent>
        </Select>
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

      <DataTable columns={columns} data={data.items} emptyMessage="No products match these filters." />

      <Pagination
        page={data.page}
        totalPages={data.totalPages}
        total={data.total}
        noun="products"
        onPageChange={(p) => controls.set("page", p > 1 ? String(p) : undefined)}
      />

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editTarget}
        onSaved={() => router.refresh()}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete product"
        description={`This permanently removes ${deleteTarget?.name ?? "this product"}.`}
        confirmLabel="Delete"
        destructive
        isConfirming={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
