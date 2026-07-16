import { Settings } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Business profile, branches, taxes, pricing, and invoice templates." />
      <EmptyState title="Settings module not built yet" icon={Settings} />
    </div>
  );
}
