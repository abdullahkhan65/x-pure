"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { OrderStatus } from "@/lib/types";
import { permissionCode } from "@/lib/types";
import { deleteOrder, updateOrderStatus } from "@/lib/orders/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useAuth } from "@/lib/auth/user-context";

const STATUSES: OrderStatus[] = [
  "PENDING",
  "ASSIGNED",
  "PACKED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "FAILED",
];

export function OrderStatusControl({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canEdit = hasPermission(permissionCode("orders", "EDIT"));
  const canDelete = hasPermission(permissionCode("orders", "DELETE"));

  function onStatusChange(next: string) {
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, next as OrderStatus);
      if (result.ok) {
        toast.success(`Status updated to ${next.replace(/_/g, " ")}.`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  async function onDelete() {
    setIsDeleting(true);
    const result = await deleteOrder(orderId);
    setIsDeleting(false);
    if (result.ok) {
      toast.success("Order deleted.");
      router.push("/orders");
      router.refresh();
    } else {
      toast.error(result.error);
      setConfirmDelete(false);
    }
  }

  if (!canEdit && !canDelete) return null;

  return (
    <div className="flex items-center gap-2">
      {canEdit ? (
        <Select value={status} onValueChange={onStatusChange} disabled={isPending}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      {canDelete ? (
        <Button variant="outline" onClick={() => setConfirmDelete(true)}>
          Delete
        </Button>
      ) : null}
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete order"
        description="This permanently removes the order and its line items."
        confirmLabel="Delete"
        destructive
        isConfirming={isDeleting}
        onConfirm={onDelete}
      />
    </div>
  );
}
