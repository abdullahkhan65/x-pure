import type { CustomerStats } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(value);
}

export function CustomerStatsCards({ stats }: { stats: CustomerStats }) {
  const items = [
    { label: "Lifetime Orders", value: String(stats.lifetimeOrders) },
    { label: "Lifetime Revenue", value: formatCurrency(stats.lifetimeRevenue) },
    { label: "Outstanding Balance", value: formatCurrency(stats.outstandingBalance) },
    { label: "Bottles Held", value: String(stats.bottlesHeld) },
    { label: "Avg. Monthly Orders", value: stats.avgMonthlyOrders.toFixed(1) },
    { label: "Complaints", value: String(stats.complaintsCount) },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="pb-2">
            <CardTitle>{item.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
