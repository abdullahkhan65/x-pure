import { permissionCode } from "@/lib/types";
import { getCurrentUser, hasPermission } from "@/lib/auth/session";
import { getReportsSummary } from "@/lib/reports/queries";

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, permissionCode("reports", "EXPORT"))) {
    return new Response("Forbidden", { status: 403 });
  }

  const summary = await getReportsSummary(user.companyId);

  const lines: string[][] = [
    ["Metric", "Value"],
    ["Total Revenue", String(summary.totalRevenue)],
    ["Revenue This Month", String(summary.revenueThisMonth)],
    ["Outstanding Receivables", String(summary.outstandingReceivables)],
    ["Total Customers", String(summary.totalCustomers)],
    [],
    ["Order Status", "Count"],
    ...summary.ordersByStatus.map((r) => [r.status, String(r.count)]),
    [],
    ["Payment Method", "Total"],
    ...summary.paymentsByMethod.map((r) => [r.method, String(r.total)]),
    [],
    ["Top Customer", "Revenue"],
    ...summary.topCustomers.map((r) => [r.name, String(r.revenue)]),
  ];

  const csv = lines.map((row) => row.map(escapeCsv).join(",")).join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="reports-summary.csv"',
    },
  });
}
