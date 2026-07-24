import { permissionCode } from "@/lib/types";
import { getCurrentUser, hasPermission } from "@/lib/auth/session";
import { exportCustomersCsv } from "@/lib/customers/queries";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, permissionCode("customers", "EXPORT"))) {
    return new Response("Forbidden", { status: 403 });
  }

  const csv = await exportCustomersCsv(user.companyId);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="customers.csv"',
    },
  });
}
