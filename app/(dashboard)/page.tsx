import { Users, ShoppingCart, Wallet, MessageSquareWarning, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { HelpButton } from "@/components/shared/help";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(value);
}

function KpiCard({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [customerCount, ordersToday, openComplaints, orderTotals, paymentTotals] = await Promise.all([
    db.customer.count({ where: { companyId: user.companyId, deletedAt: null } }),
    db.order.count({ where: { companyId: user.companyId, orderDate: { gte: todayStart } } }),
    db.complaint.count({
      where: { companyId: user.companyId, status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS"] } },
    }),
    db.order.aggregate({
      where: { companyId: user.companyId, status: { not: "CANCELLED" } },
      _sum: { total: true },
    }),
    db.payment.aggregate({
      where: { companyId: user.companyId, status: "COMPLETED" },
      _sum: { amount: true },
    }),
  ]);

  const outstanding = Math.max(Number(orderTotals._sum.total ?? 0) - Number(paymentTotals._sum.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user.firstName}`}
        description="Here's what's happening across your business today."
        actions={<HelpButton topicKey="overview" label="How to use X-Pure" variant="outline" />}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Customers" value={String(customerCount)} icon={Users} />
        <KpiCard label="Today's Orders" value={String(ordersToday)} icon={ShoppingCart} />
        <KpiCard label="Outstanding Payments" value={formatCurrency(outstanding)} icon={Wallet} />
        <KpiCard label="Open Complaints" value={String(openComplaints)} icon={MessageSquareWarning} />
      </div>
      <p className="text-sm text-muted-foreground">
        All four KPIs query the database directly — Orders, Payments, and Complaints will start moving as those
        modules gain write paths.
      </p>
    </div>
  );
}
