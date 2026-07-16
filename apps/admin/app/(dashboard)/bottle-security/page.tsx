import { Droplet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function BottleSecurityPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Bottle Security"
        description="Deposits, bottle ledger, lost/broken tracking, and replacement history."
      />
      <EmptyState
        title="Bottle Security module not built yet"
        description="The BottleLedgerEntry and DepositLedgerEntry tables already exist in the schema — this module needs its API and UI built on top."
        icon={Droplet}
      />
    </div>
  );
}
