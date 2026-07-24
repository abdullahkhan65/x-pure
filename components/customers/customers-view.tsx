"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Plus } from "lucide-react";
import { toast } from "sonner";
import type { CustomerQuery, CustomerResponse, CustomerStatus, CustomerType } from "@/lib/types";
import { permissionCode } from "@/lib/types";
import type { PaginatedCustomers } from "@/lib/customers/queries";
import { deleteCustomer } from "@/lib/customers/actions";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CustomerFilters } from "@/components/customers/customer-filters";
import { buildCustomerColumns } from "@/components/customers/customer-table-columns";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/user-context";

interface CustomersViewProps {
  data: PaginatedCustomers;
  query: CustomerQuery;
}

/** The URL is the source of truth: filter/pagination changes rewrite the query string and the server re-renders. */
export function CustomersView({ data, query }: CustomersViewProps) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(query.search ?? "");
  const [deleteTarget, setDeleteTarget] = useState<CustomerResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canCreate = hasPermission(permissionCode("customers", "CREATE"));
  const canEdit = hasPermission(permissionCode("customers", "EDIT"));
  const canDelete = hasPermission(permissionCode("customers", "DELETE"));
  const canExport = hasPermission(permissionCode("customers", "EXPORT"));

  function navigate(next: {
    search?: string;
    customerType?: CustomerType | undefined;
    status?: CustomerStatus | undefined;
    page?: number;
  }) {
    const merged = {
      search: next.search !== undefined ? next.search : (query.search ?? ""),
      customerType: "customerType" in next ? next.customerType : query.customerType,
      status: "status" in next ? next.status : query.status,
      page: next.page ?? 1,
    };
    const params = new URLSearchParams();
    if (merged.search) params.set("search", merged.search);
    if (merged.customerType) params.set("customerType", merged.customerType);
    if (merged.status) params.set("status", merged.status);
    if (merged.page > 1) params.set("page", String(merged.page));
    startTransition(() => {
      router.replace(params.size ? `/customers?${params}` : "/customers");
    });
  }

  // Debounce free-text search; skip the mount run so the initial URL isn't rewritten.
  const searchInitialized = useRef(false);
  useEffect(() => {
    if (!searchInitialized.current) {
      searchInitialized.current = true;
      return;
    }
    const timeout = setTimeout(() => navigate({ search, page: 1 }), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const columns = buildCustomerColumns({ onDelete: setDeleteTarget, canEdit, canDelete });

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await deleteCustomer(deleteTarget.id);
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
      <PageHeader
        title="Customers"
        description="Manage residential, commercial, and institutional customers."
        actions={
          <>
            {canExport ? (
              <Button variant="outline" asChild>
                <a href="/customers/export" download>
                  <Download className="mr-2 h-4 w-4" /> Export
                </a>
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
        onSearchChange={setSearch}
        customerType={query.customerType}
        onCustomerTypeChange={(value) => navigate({ customerType: value })}
        status={query.status}
        onStatusChange={(value) => navigate({ status: value })}
      />

      <DataTable
        columns={columns}
        data={data.items}
        isLoading={isPending}
        emptyMessage="No customers match these filters."
        onRowClick={(row) => router.push(`/customers/${row.id}`)}
      />

      {data.totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {data.page} of {data.totalPages} — {data.total} customers
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.page <= 1}
              onClick={() => navigate({ page: data.page - 1 })}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page >= data.totalPages}
              onClick={() => navigate({ page: data.page + 1 })}
            >
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
        isConfirming={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
