import type { ReactNode } from "react";
import { Droplets } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center justify-center gap-2">
          <Droplets className="h-7 w-7 text-brand-600" />
          <span className="text-xl font-semibold">X-Pure</span>
        </div>
        {children}
      </div>
    </div>
  );
}
