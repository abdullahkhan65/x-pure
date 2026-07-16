import { Route } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function RoutesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Routes" description="Delivery zones, areas, and driver assignments." />
      <EmptyState title="Routes module not built yet" icon={Route} />
    </div>
  );
}
