"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CreateCustomerInput } from "@/lib/types";
import { createCustomer } from "@/lib/customers/actions";
import { CustomerForm } from "./customer-form";

export function CustomerCreateForm() {
  const router = useRouter();

  async function handleSubmit(values: CreateCustomerInput) {
    const result = await createCustomer(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`${result.data.name} was created.`);
    router.push(`/customers/${result.data.id}`);
    router.refresh();
  }

  return <CustomerForm onSubmit={handleSubmit} submitLabel="Create customer" />;
}
