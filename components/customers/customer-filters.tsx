"use client";

import type { CustomerStatus, CustomerType } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CUSTOMER_TYPES: CustomerType[] = [
  "RESIDENTIAL",
  "COMMERCIAL",
  "GOVERNMENT",
  "SCHOOL",
  "HOSPITAL",
  "RESTAURANT",
  "OFFICE",
  "HOTEL",
  "INDUSTRIAL",
];
const CUSTOMER_STATUSES: CustomerStatus[] = ["ACTIVE", "INACTIVE", "SUSPENDED"];

interface CustomerFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  customerType: CustomerType | undefined;
  onCustomerTypeChange: (value: CustomerType | undefined) => void;
  status: CustomerStatus | undefined;
  onStatusChange: (value: CustomerStatus | undefined) => void;
}

export function CustomerFilters({
  search,
  onSearchChange,
  customerType,
  onCustomerTypeChange,
  status,
  onStatusChange,
}: CustomerFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Input
        placeholder="Search name, phone, email, code..."
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        className="sm:max-w-xs"
      />
      <Select
        value={customerType ?? "all"}
        onValueChange={(value) => onCustomerTypeChange(value === "all" ? undefined : (value as CustomerType))}
      >
        <SelectTrigger className="sm:w-44">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {CUSTOMER_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={status ?? "all"}
        onValueChange={(value) => onStatusChange(value === "all" ? undefined : (value as CustomerStatus))}
      >
        <SelectTrigger className="sm:w-40">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {CUSTOMER_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
