import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
}

/** Used for every nav module that doesn't have a built-out feature yet (see nav-items.ts). */
export function EmptyState({ title, description, icon: Icon = Construction }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {description ?? "This module is scaffolded but not built out yet. Customers is the reference implementation to copy this pattern from."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
