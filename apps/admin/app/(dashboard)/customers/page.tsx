"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Download } from "lucide-react";
import { toast } from "sonner";
import type { CustomerResponse, CustomerStatus, CustomerType } from "@x-pure/types";
import { permissionCode } from "@x-pure/types";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CustomerFilters } from "@/components/customers/customer-filters";
import { buildCustomerColumns } from "@/components/customers/customer-table-columns";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { useCustomers, useDeleteCustomer } from "@/hooks/use-customers";
import { apiFetch, ApiError } from "@/lib/api-client";

const PAGE_SIZE = 20;

export default function CustomersPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [customerType, setCustomerType] = useState<CustomerType | undefined>();
  const [status, setStatus] = useState<CustomerStatus | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<CustomerResponse | null>(null);

  const { data, isLoading } = useCustomers({
    page,
    pageSize: PAGE_SIZE,
    search,
    customerType,
    status,
    sortOrder: "desc",
  });
  const deleteCustomer = useDeleteCustomer();

  const canCreate = hasPermission(permissionCode("customers", "CREATE"));
  const canEdit = hasPermission(permissionCode("customers", "EDIT"));
  const canDelete = hasPermission(permissionCode("customers", "DELETE"));
  const canExport = hasPermission(permissionCode("customers", "EXPORT"));

  const columns = buildCustomerColumns({ onDelete: setDeleteTarget, canEdit, canDelete });

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteCustomer.mutateAsync(deleteTarget.id);
      toast.success(`${deleteTarget.name} was deleted.`);
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete customer.");
    }
  }

  async function handleExport() {
    try {
      const csv = await apiFetch<string>("/customers/export");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "customers.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to export customers.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage residential, commercial, and institutional customers."
        actions={
          <>
            {canExport ? (
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            ) : null}
            {canCreate ? (
              <Button onClick={() => router.push("/customers/new")}>
                <Plus className="mr-2 h-4 w-4" /> New Customer
              </Button>
            ) : null}
          </>
        }
      />

      <CustomerFilters
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        customerType={customerType}
        onCustomerTypeChange={(value) => {
          setCustomerType(value);
          setPage(1);
        }}
        status={status}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
      />

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        emptyMessage="No customers match these filters."
        onRowClick={(row) => router.push(`/customers/${row.id}`)}
      />

      {data && data.totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {data.page} of {data.totalPages} — {data.total} customers
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete customer"
        description={`This removes ${deleteTarget?.name ?? "this customer"} from active records.`}
        confirmLabel="Delete"
        destructive
        isConfirming={deleteCustomer.isPending}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
