import Link from "next/link";
import { Download } from "lucide-react";
import { permissionCode } from "@/lib/types";
import { hasPermission, requirePermission } from "@/lib/auth/session";
import { getReportsSummary } from "@/lib/reports/queries";
import { formatCurrency } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function label(value: string) {
  const text = value.toLowerCase().replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default async function ReportsPage() {
  const user = await requirePermission(permissionCode("reports", "VIEW"));
  const summary = await getReportsSummary(user.companyId);
  const canExport = hasPermission(user, permissionCode("reports", "EXPORT"));

  const kpis = [
    { label: "Total Revenue", value: formatCurrency(summary.totalRevenue) },
    { label: "Revenue This Month", value: formatCurrency(summary.revenueThisMonth) },
    { label: "Outstanding Receivables", value: formatCurrency(summary.outstandingReceivables) },
    { label: "Total Customers", value: String(summary.totalCustomers) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Revenue, orders, payments, and top customers at a glance."
        actions={
          canExport ? (
            <Button variant="outline" asChild>
              <a href="/reports/export" download>
                <Download className="mr-2 h-4 w-4" /> Export
              </a>
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2">
              <CardTitle>{kpi.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Orders by status</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.ordersByStatus.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.ordersByStatus.map((row) => (
                    <TableRow key={row.status}>
                      <TableCell>{label(row.status)}</TableCell>
                      <TableCell className="text-right">{row.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payments by method</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.paymentsByMethod.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.paymentsByMethod.map((row) => (
                    <TableRow key={row.method}>
                      <TableCell>{label(row.method)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No payments yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top customers by revenue</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.topCustomers.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.topCustomers.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link href={`/customers/${row.id}`} className="hover:underline">
                        {row.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(row.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No revenue yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
