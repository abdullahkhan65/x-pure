import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  Warehouse,
  Droplet,
  Wallet,
  MessageSquareWarning,
  UserCog,
  Route,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { ModuleKey } from "@x-pure/types";

export interface NavItem {
  label: string;
  href: string;
  module: ModuleKey;
  icon: LucideIcon;
  /** false renders <EmptyState/> — scaffolded in the nav so the shell feels complete, but no feature built yet. */
  implemented: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", module: "dashboard", icon: LayoutDashboard, implemented: true },
  { label: "Customers", href: "/customers", module: "customers", icon: Users, implemented: true },
  { label: "Orders", href: "/orders", module: "orders", icon: ShoppingCart, implemented: false },
  { label: "Products", href: "/products", module: "products", icon: Package, implemented: false },
  { label: "Inventory", href: "/inventory", module: "inventory", icon: Warehouse, implemented: false },
  { label: "Bottle Security", href: "/bottle-security", module: "bottle_security", icon: Droplet, implemented: false },
  { label: "Payments", href: "/payments", module: "payments", icon: Wallet, implemented: false },
  { label: "Complaints", href: "/complaints", module: "complaints", icon: MessageSquareWarning, implemented: false },
  { label: "Employees", href: "/employees", module: "employees", icon: UserCog, implemented: false },
  { label: "Routes", href: "/routes", module: "routes", icon: Route, implemented: false },
  { label: "Reports", href: "/reports", module: "reports", icon: BarChart3, implemented: false },
  { label: "Settings", href: "/settings", module: "settings", icon: Settings, implemented: false },
];
