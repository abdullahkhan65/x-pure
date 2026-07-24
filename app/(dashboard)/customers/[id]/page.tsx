import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { permissionCode } from "@/lib/types";
import { hasPermission, requirePermission } from "@/lib/auth/session";
import { getCustomer } from "@/lib/customers/queries";
import { PageHeader } from "@/components/shared/page-header";
import { CustomerStatsCards } from "@/components/customers/customer-stats-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUS_VARIANT = { ACTIVE: "success", INACTIVE: "secondary", SUSPENDED: "destructive" } as const;

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePermission(permissionCode("customers", "VIEW"));
  const customer = await getCustomer(user.companyId, id);
  if (!customer) notFound();

  const canEdit = hasPermission(user, permissionCode("customers", "EDIT"));

  const fields: [string, string][] = [
    ["Phone", customer.phone],
    ["WhatsApp", customer.whatsapp ?? "—"],
    ["Email", customer.email ?? "—"],
    ["CNIC", customer.cnic ?? "—"],
    ["Business name", customer.businessName ?? "—"],
    ["Preferred delivery time", customer.preferredDeliveryTime ?? "—"],
  ];

  const addressParts = [
    customer.houseNumber,
    customer.street,
    customer.sector,
    customer.area,
    customer.city,
    customer.province,
    customer.postalCode,
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.name}
        description={customer.customerCode}
        actions={
          canEdit ? (
            <Button asChild>
              <Link href={`/customers/${customer.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{customer.customerType}</Badge>
        <Badge variant={STATUS_VARIANT[customer.status]}>{customer.status}</Badge>
      </div>

      {customer.stats ? <CustomerStatsCards stats={customer.stats} /> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-y-3 text-sm">
            {fields.map(([label, value]) => (
              <div key={label} className="contents">
                <div className="text-muted-foreground">{label}</div>
                <div>{value}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {addressParts.length ? (
              addressParts.join(", ")
            ) : (
              <span className="text-muted-foreground">No address on file</span>
            )}
            {customer.deliveryInstructions ? (
              <p className="mt-3 text-muted-foreground">Delivery instructions: {customer.deliveryInstructions}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {customer.notes ? (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{customer.notes}</CardContent>
        </Card>
      ) : null}
    </div>
  );
}
