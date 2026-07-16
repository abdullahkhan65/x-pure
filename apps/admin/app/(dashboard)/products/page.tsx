import { Package } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Products" description="Bottles, dispensers, and accessories with pricing and stock." />
      <EmptyState title="Products module not built yet" icon={Package} />
    </div>
  );
}
