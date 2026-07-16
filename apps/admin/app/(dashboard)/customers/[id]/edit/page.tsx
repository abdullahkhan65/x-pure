"use client";

import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CreateCustomerInput } from "@x-pure/types";
import { PageHeader } from "@/components/shared/page-header";
import { CustomerForm, customerToFormDefaults } from "@/components/customers/customer-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomer, useUpdateCustomer } from "@/hooks/use-customers";
import { ApiError } from "@/lib/api-client";

export default function EditCustomerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: customer, isLoading } = useCustomer(params.id);
  const updateCustomer = useUpdateCustomer(params.id);

  async function handleSubmit(values: CreateCustomerInput) {
    try {
      const updated = await updateCustomer.mutateAsync(values);
      toast.success(`${updated.name} was updated.`);
      router.push(`/customers/${updated.id}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update customer.");
    }
  }

  if (isLoading || !customer) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`Edit ${customer.name}`} description={customer.customerCode} />
      <CustomerForm defaultValues={customerToFormDefaults(customer)} onSubmit={handleSubmit} submitLabel="Save changes" />
    </div>
  );
}
