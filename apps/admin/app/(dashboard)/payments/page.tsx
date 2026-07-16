import { Wallet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="Cash, bank transfer, EasyPaisa, JazzCash, and credit accounts." />
      <EmptyState title="Payments module not built yet" icon={Wallet} />
    </div>
  );
}
