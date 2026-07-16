"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CreateCustomerInput } from "@x-pure/types";
import { PageHeader } from "@/components/shared/page-header";
import { CustomerForm } from "@/components/customers/customer-form";
import { useCreateCustomer } from "@/hooks/use-customers";
import { ApiError } from "@/lib/api-client";

export default function NewCustomerPage() {
  const router = useRouter();
  const createCustomer = useCreateCustomer();

  async function handleSubmit(values: CreateCustomerInput) {
    try {
      const customer = await createCustomer.mutateAsync(values);
      toast.success(`${customer.name} was created.`);
      router.push(`/customers/${customer.id}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to create customer.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="New Customer" description="Add a new customer to your delivery roster." />
      <CustomerForm onSubmit={handleSubmit} submitLabel="Create customer" />
    </div>
  );
}
