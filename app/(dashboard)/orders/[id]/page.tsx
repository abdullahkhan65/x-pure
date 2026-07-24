import Link from "next/link";
import { notFound } from "next/navigation";
import { permissionCode } from "@/lib/types";
import { requirePermission } from "@/lib/auth/session";
import { getOrder } from "@/lib/orders/queries";
import { formatCurrency, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/status-badges";
import { OrderStatusControl } from "@/components/orders/order-status-control";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePermission(permissionCode("orders", "VIEW"));
  const order = await getOrder(user.companyId, id);
  if (!order) notFound();

  const balance = Math.max(order.total - order.amountPaid, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={order.orderNumber}
        description={
          <>
            <Link href={`/customers/${order.customerId}`} className="hover:underline">
              {order.customerName}
            </Link>{" "}
            · {formatDate(order.orderDate)}
          </>
        }
        actions={<OrderStatusControl orderId={order.id} status={order.status} />}
      />

      <div className="flex flex-wrap gap-2">
        <OrderStatusBadge status={order.status} />
        <PaymentStatusBadge status={order.paymentStatus} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Unit price</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Line total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.lineTotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Subtotal" value={formatCurrency(order.subtotal)} />
            <Row label="Discount" value={`−${formatCurrency(order.discount)}`} />
            <Row label="Tax" value={formatCurrency(order.tax)} />
            <div className="flex justify-between border-t pt-2 text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
            <Row label="Paid" value={formatCurrency(order.amountPaid)} />
            <Row label="Balance" value={formatCurrency(balance)} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Delivery</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-y-3 text-sm">
            <span className="text-muted-foreground">Route</span>
            <span>{order.routeName ?? "—"}</span>
            <span className="text-muted-foreground">Rider</span>
            <span>{order.riderName ?? "Unassigned"}</span>
            <span className="text-muted-foreground">Delivery date</span>
            <span>{formatDate(order.deliveryDate)}</span>
          </CardContent>
        </Card>

        {order.notes ? (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">{order.notes}</CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
