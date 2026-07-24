"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { BottleDirection, DepositDirection } from "@/lib/types";
import type { CustomerOption } from "@/lib/customers/queries";
import { recordBottleEntry, recordDepositEntry } from "@/lib/bottles/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type EntryType = "bottle" | "deposit";

const BOTTLE_DIRECTIONS: BottleDirection[] = ["ISSUED", "RETURNED", "LOST", "BROKEN", "TRANSFERRED", "PURCHASED"];
const DEPOSIT_DIRECTIONS: DepositDirection[] = ["COLLECTED", "REFUNDED", "ADJUSTED"];

const EntryFormSchema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  direction: z.string().min(1),
  value: z.number().positive("Enter a value"),
  notes: z.string().max(500).optional(),
});
type EntryFormValues = z.infer<typeof EntryFormSchema>;

interface BottleEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: CustomerOption[];
  defaultCustomerId?: string;
  onSaved: () => void;
}

export function BottleEntryDialog({
  open,
  onOpenChange,
  customers,
  defaultCustomerId,
  onSaved,
}: BottleEntryDialogProps) {
  const [type, setType] = useState<EntryType>("bottle");
  const form = useForm<EntryFormValues>({
    resolver: zodResolver(EntryFormSchema),
    defaultValues: { customerId: "", direction: "ISSUED", value: 1 },
  });

  useEffect(() => {
    if (!open) return;
    setType("bottle");
    form.reset({ customerId: defaultCustomerId ?? "", direction: "ISSUED", value: 1 });
  }, [open, defaultCustomerId, form]);

  function switchType(next: EntryType) {
    setType(next);
    form.setValue("direction", next === "bottle" ? "ISSUED" : "COLLECTED");
  }

  async function onSubmit(values: EntryFormValues) {
    const result =
      type === "bottle"
        ? await recordBottleEntry({
            customerId: values.customerId,
            direction: values.direction as BottleDirection,
            quantity: Math.round(values.value),
            notes: values.notes,
          })
        : await recordDepositEntry({
            customerId: values.customerId,
            direction: values.direction as DepositDirection,
            amount: values.value,
            notes: values.notes,
          });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(type === "bottle" ? "Bottle movement recorded." : "Deposit recorded.");
    onOpenChange(false);
    onSaved();
  }

  const directions = type === "bottle" ? BOTTLE_DIRECTIONS : DEPOSIT_DIRECTIONS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record ledger entry</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 rounded-md bg-muted p-1">
          {(["bottle", "deposit"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => switchType(t)}
              className={cn(
                "rounded px-3 py-1.5 text-sm font-medium transition-colors",
                type === t ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t === "bottle" ? "Bottle movement" : "Deposit"}
            </button>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="direction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {directions.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d.charAt(0) + d.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{type === "bottle" ? "Quantity" : "Amount (PKR)"}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step={type === "bottle" ? 1 : "0.01"}
                        min={type === "bottle" ? 1 : 0}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Record entry"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
