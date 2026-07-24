"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CreateCustomerInput, CustomerResponse } from "@/lib/types";
import { updateCustomer } from "@/lib/customers/actions";
import { CustomerForm, customerToFormDefaults } from "./customer-form";

export function CustomerEditForm({ customer }: { customer: CustomerResponse }) {
  const router = useRouter();

  async function handleSubmit(values: CreateCustomerInput) {
    const result = await updateCustomer(customer.id, values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`${result.data.name} was updated.`);
    router.push(`/customers/${result.data.id}`);
    router.refresh();
  }

  return (
    <CustomerForm defaultValues={customerToFormDefaults(customer)} onSubmit={handleSubmit} submitLabel="Save changes" />
  );
}
