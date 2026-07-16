import { Warehouse } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Inventory" description="Warehouse stock, receipts, adjustments, and low-stock alerts." />
      <EmptyState title="Inventory module not built yet" icon={Warehouse} />
    </div>
  );
}
