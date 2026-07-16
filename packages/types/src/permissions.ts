/**
 * Single source of truth for RBAC. The seed script upserts Permission rows from this map,
 * the API's PermissionsGuard checks codes derived from it, and the admin sidebar gates nav
 * items against the same codes — none of the three can drift out of sync.
 */

export const PERMISSION_ACTIONS = [
  "VIEW",
  "CREATE",
  "EDIT",
  "DELETE",
  "APPROVE",
  "EXPORT",
] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export const MODULES = [
  "dashboard",
  "customers",
  "orders",
  "products",
  "inventory",
  "bottle_security",
  "payments",
  "complaints",
  "employees",
  "routes",
  "reports",
  "settings",
] as const;

export type ModuleKey = (typeof MODULES)[number];

/** Which actions are meaningful per module. Not every module supports every action. */
export const MODULE_ACTIONS: Record<ModuleKey, readonly PermissionAction[]> = {
  dashboard: ["VIEW"],
  customers: ["VIEW", "CREATE", "EDIT", "DELETE", "EXPORT"],
  orders: ["VIEW", "CREATE", "EDIT", "DELETE", "APPROVE", "EXPORT"],
  products: ["VIEW", "CREATE", "EDIT", "DELETE"],
  inventory: ["VIEW", "CREATE", "EDIT", "DELETE"],
  bottle_security: ["VIEW", "CREATE", "EDIT", "EXPORT"],
  payments: ["VIEW", "CREATE", "EDIT", "APPROVE", "EXPORT"],
  complaints: ["VIEW", "CREATE", "EDIT", "DELETE"],
  employees: ["VIEW", "CREATE", "EDIT", "DELETE"],
  routes: ["VIEW", "CREATE", "EDIT", "DELETE"],
  reports: ["VIEW", "EXPORT"],
  settings: ["VIEW", "EDIT"],
};

export function permissionCode(module: ModuleKey, action: PermissionAction): string {
  return `${module}.${action.toLowerCase()}`;
}

/** Flat catalog of every valid "module.action" code — what the seed script upserts. */
export const PERMISSION_CODES: string[] = MODULES.flatMap((module) =>
  MODULE_ACTIONS[module].map((action) => permissionCode(module, action)),
);

export const SYSTEM_ROLE_NAMES = [
  "Super Admin",
  "Branch Manager",
  "Sales Manager",
  "Delivery Manager",
  "Delivery Rider",
  "Inventory Manager",
  "Customer Support",
  "Accountant",
] as const;

export type SystemRoleName = (typeof SYSTEM_ROLE_NAMES)[number];
