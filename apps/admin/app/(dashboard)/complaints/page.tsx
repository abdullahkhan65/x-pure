import { MessageSquareWarning } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function ComplaintsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Complaints" description="Track and resolve customer complaints from open to closed." />
      <EmptyState title="Complaints module not built yet" icon={MessageSquareWarning} />
    </div>
  );
}
