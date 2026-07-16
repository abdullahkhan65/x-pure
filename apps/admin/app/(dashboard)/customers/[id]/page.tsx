"use client";

import { useParams, useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { permissionCode } from "@x-pure/types";
import { PageHeader } from "@/components/shared/page-header";
import { CustomerStatsCards } from "@/components/customers/customer-stats-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import { useCustomer } from "@/hooks/use-customers";

const STATUS_VARIANT = { ACTIVE: "success", INACTIVE: "secondary", SUSPENDED: "destructive" } as const;

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { hasPermission } = useAuth();
  const { data: customer, isLoading } = useCustomer(params.id);

  const canEdit = hasPermission(permissionCode("customers", "EDIT"));

  if (isLoading || !customer) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

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
            <Button onClick={() => router.push(`/customers/${customer.id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
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
