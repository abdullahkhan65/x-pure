import { ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Create, assign, and track deliveries from pending through delivered." />
      <EmptyState title="Orders module not built yet" icon={ShoppingCart} />
    </div>
  );
}
