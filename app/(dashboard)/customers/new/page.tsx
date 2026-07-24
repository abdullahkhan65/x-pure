import { permissionCode } from "@/lib/types";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { CustomerCreateForm } from "@/components/customers/customer-create-form";

export default async function NewCustomerPage() {
  await requirePermission(permissionCode("customers", "CREATE"));

  return (
    <div className="space-y-6">
      <PageHeader title="New Customer" description="Add a new customer to your delivery roster." />
      <CustomerCreateForm />
    </div>
  );
}
