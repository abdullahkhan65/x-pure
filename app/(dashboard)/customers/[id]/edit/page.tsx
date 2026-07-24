import { notFound } from "next/navigation";
import { permissionCode } from "@/lib/types";
import { requirePermission } from "@/lib/auth/session";
import { getCustomer } from "@/lib/customers/queries";
import { PageHeader } from "@/components/shared/page-header";
import { CustomerEditForm } from "@/components/customers/customer-edit-form";

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePermission(permissionCode("customers", "EDIT"));
  const customer = await getCustomer(user.companyId, id);
  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={`Edit ${customer.name}`} description={customer.customerCode} />
      <CustomerEditForm customer={customer} />
    </div>
  );
}
