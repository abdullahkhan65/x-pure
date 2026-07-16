import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Revenue, orders, inventory, bottle ledger, and profit reporting." />
      <EmptyState title="Reports module not built yet" icon={BarChart3} />
    </div>
  );
}
