import { UserCog } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Employees" description="Drivers, sales, managers, and support staff." />
      <EmptyState
        title="Employees module not built yet"
        description="Staff already exist as Users with a Role — this module needs an HR-detail table extending User plus API/UI on top."
        icon={UserCog}
      />
    </div>
  );
}
