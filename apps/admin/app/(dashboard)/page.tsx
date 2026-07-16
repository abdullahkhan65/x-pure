"use client";

import { Users, ShoppingCart, Wallet, MessageSquareWarning } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { useCustomers } from "@/hooks/use-customers";
import { useAuth } from "@/lib/auth/auth-context";

interface KpiCardProps {
  label: string;
  value: string;
  icon: typeof Users;
  live?: boolean;
}

function KpiCard({ label, value, icon: Icon, live }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {!live ? (
          <Badge variant="outline" className="mt-2">
            Coming soon
          </Badge>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: customers } = useCustomers({ page: 1, pageSize: 1, sortOrder: "desc" });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.firstName ?? ""}`}
        description="Here's what's happening across your business today."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Customers" value={customers ? String(customers.total) : "—"} icon={Users} live />
        <KpiCard label="Today's Orders" value="—" icon={ShoppingCart} />
        <KpiCard label="Outstanding Payments" value="—" icon={Wallet} />
        <KpiCard label="Open Complaints" value="—" icon={MessageSquareWarning} />
      </div>
      <p className="text-sm text-muted-foreground">
        Customers is the only module wired to live data so far — the rest of this dashboard lights up as Orders,
        Payments, and Complaints get built out on top of the schema that&apos;s already in place.
      </p>
    </div>
  );
}
