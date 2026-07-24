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
import type { ModuleKey } from "@/lib/types";

export interface NavItem {
  label: string;
  href: string;
  module: ModuleKey;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", module: "dashboard", icon: LayoutDashboard },
  { label: "Customers", href: "/customers", module: "customers", icon: Users },
  { label: "Orders", href: "/orders", module: "orders", icon: ShoppingCart },
  { label: "Products", href: "/products", module: "products", icon: Package },
  { label: "Inventory", href: "/inventory", module: "inventory", icon: Warehouse },
  { label: "Bottle Security", href: "/bottle-security", module: "bottle_security", icon: Droplet },
  { label: "Payments", href: "/payments", module: "payments", icon: Wallet },
  { label: "Complaints", href: "/complaints", module: "complaints", icon: MessageSquareWarning },
  { label: "Employees", href: "/employees", module: "employees", icon: UserCog },
  { label: "Routes", href: "/routes", module: "routes", icon: Route },
  { label: "Reports", href: "/reports", module: "reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", module: "settings", icon: Settings },
];
