"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { CustomerResponse } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const STATUS_VARIANT: Record<CustomerResponse["status"], "success" | "secondary" | "destructive"> = {
  ACTIVE: "success",
  INACTIVE: "secondary",
  SUSPENDED: "destructive",
};

interface CustomerColumnsOptions {
  onDelete: (customer: CustomerResponse) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function buildCustomerColumns({ onDelete, canEdit, canDelete }: CustomerColumnsOptions): ColumnDef<CustomerResponse>[] {
  const columns: ColumnDef<CustomerResponse>[] = [
    {
      accessorKey: "customerCode",
      header: "Code",
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.customerCode}</span>,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          {row.original.businessName ? <div className="text-xs text-muted-foreground">{row.original.businessName}</div> : null}
        </div>
      ),
    },
    { accessorKey: "phone", header: "Phone" },
    {
      accessorKey: "customerType",
      header: "Type",
      cell: ({ row }) => <Badge variant="outline">{row.original.customerType}</Badge>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant={STATUS_VARIANT[row.original.status]}>{row.original.status}</Badge>,
    },
    { accessorKey: "city", header: "City", cell: ({ row }) => row.original.city ?? "—" },
  ];

  if (canEdit || canDelete) {
    columns.push({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" onClick={(event) => event.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
            {canEdit ? (
              <DropdownMenuItem asChild>
                <Link href={`/customers/${row.original.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Link>
              </DropdownMenuItem>
            ) : null}
            {canDelete ? (
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(row.original)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    });
  }

  return columns;
}
