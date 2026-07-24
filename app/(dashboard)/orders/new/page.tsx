import { permissionCode } from "@/lib/types";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { OrderForm } from "@/components/orders/order-form";
import { listCustomerOptions } from "@/lib/customers/queries";
import { listActiveProducts } from "@/lib/products/queries";
import { listRouteOptions } from "@/lib/routes/queries";
import { listStaffOptions } from "@/lib/employees/queries";

export default async function NewOrderPage() {
  const user = await requirePermission(permissionCode("orders", "CREATE"));

  const [customers, products, routes, riders] = await Promise.all([
    listCustomerOptions(user.companyId),
    listActiveProducts(user.companyId),
    listRouteOptions(user.companyId),
    listStaffOptions(user.companyId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="New Order" description="Build an order, assign delivery, and track it through fulfillment." />
      <OrderForm
        customers={customers}
        products={products.map((p) => ({ id: p.id, name: p.name, unitPrice: p.unitPrice }))}
        routes={routes}
        riders={riders}
      />
    </div>
  );
}
