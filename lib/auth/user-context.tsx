"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CurrentUser } from "@/lib/types";

interface AuthContextValue {
  user: CurrentUser;
  hasPermission: (code: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Makes the server-resolved user available to client components inside the dashboard. */
export function UserProvider({ user, children }: { user: CurrentUser; children: ReactNode }) {
  const hasPermission = (code: string) => user.permissions.includes(code);
  return <AuthContext.Provider value={{ user, hasPermission }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within UserProvider");
  return ctx;
}
