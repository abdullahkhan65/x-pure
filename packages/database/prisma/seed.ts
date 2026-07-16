import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";
import {
  MODULES,
  MODULE_ACTIONS,
  PERMISSION_CODES,
  permissionCode,
  SYSTEM_ROLE_NAMES,
  type ModuleKey,
  type PermissionAction,
  type SystemRoleName,
} from "@x-pure/types";

const prisma = new PrismaClient();

function codesFor(matrix: Partial<Record<ModuleKey, PermissionAction[]>>): string[] {
  const codes: string[] = [];
  for (const [module, actions] of Object.entries(matrix) as [ModuleKey, PermissionAction[]][]) {
    const allowedActions = MODULE_ACTIONS[module];
    for (const action of actions) {
      if (allowedActions.includes(action)) codes.push(permissionCode(module, action));
    }
  }
  return codes;
}

/** Grant matrix per PRD role description. Super Admin gets everything. */
const ROLE_GRANTS: Record<SystemRoleName, string[]> = {
  "Super Admin": PERMISSION_CODES,
  "Branch Manager": codesFor({
    dashboard: ["VIEW"],
    customers: ["VIEW", "CREATE", "EDIT", "EXPORT"],
    orders: ["VIEW", "CREATE", "EDIT", "APPROVE", "EXPORT"],
    products: ["VIEW", "CREATE", "EDIT"],
    inventory: ["VIEW", "CREATE", "EDIT"],
    bottle_security: ["VIEW", "CREATE", "EDIT", "EXPORT"],
    payments: ["VIEW", "CREATE", "EDIT", "APPROVE", "EXPORT"],
    complaints: ["VIEW", "CREATE", "EDIT"],
    employees: ["VIEW", "CREATE", "EDIT"],
    routes: ["VIEW", "CREATE", "EDIT"],
    reports: ["VIEW", "EXPORT"],
    settings: ["VIEW"],
  }),
  "Sales Manager": codesFor({
    dashboard: ["VIEW"],
    customers: ["VIEW", "CREATE", "EDIT", "DELETE", "EXPORT"],
    orders: ["VIEW", "CREATE", "EDIT", "APPROVE", "EXPORT"],
    products: ["VIEW"],
    reports: ["VIEW", "EXPORT"],
  }),
  "Delivery Manager": codesFor({
    dashboard: ["VIEW"],
    customers: ["VIEW"],
    orders: ["VIEW", "EDIT", "APPROVE", "EXPORT"],
    routes: ["VIEW", "CREATE", "EDIT", "DELETE"],
    complaints: ["VIEW", "EDIT"],
  }),
  "Delivery Rider": codesFor({
    dashboard: ["VIEW"],
    customers: ["VIEW"],
    orders: ["VIEW", "EDIT"],
    bottle_security: ["VIEW", "EDIT"],
    complaints: ["VIEW", "CREATE"],
  }),
  "Inventory Manager": codesFor({
    dashboard: ["VIEW"],
    products: ["VIEW", "CREATE", "EDIT", "DELETE"],
    inventory: ["VIEW", "CREATE", "EDIT", "DELETE"],
    bottle_security: ["VIEW", "CREATE", "EDIT", "EXPORT"],
  }),
  "Customer Support": codesFor({
    dashboard: ["VIEW"],
    customers: ["VIEW", "EDIT"],
    orders: ["VIEW"],
    complaints: ["VIEW", "CREATE", "EDIT", "DELETE"],
  }),
  Accountant: codesFor({
    dashboard: ["VIEW"],
    customers: ["VIEW"],
    payments: ["VIEW", "CREATE", "EDIT", "APPROVE", "EXPORT"],
    bottle_security: ["VIEW"],
    reports: ["VIEW", "EXPORT"],
  }),
};

async function nextSequence(companyId: string, key: string): Promise<number> {
  const counter = await prisma.counter.update({
    where: { companyId_key: { companyId, key } },
    data: { value: { increment: 1 } },
  });
  return counter.value;
}

async function seedPermissionCatalog() {
  for (const moduleKey of MODULES) {
    for (const action of MODULE_ACTIONS[moduleKey]) {
      const code = permissionCode(moduleKey, action);
      await prisma.permission.upsert({
        where: { code },
        update: {},
        create: { module: moduleKey, action, code },
      });
    }
  }
}

async function seedCompanyAndRoles() {
  const company = await prisma.company.upsert({
    where: { slug: "x-pure" },
    update: {},
    create: { name: "X-Pure Water Delivery", slug: "x-pure" },
  });

  const branch = await prisma.branch.upsert({
    where: { companyId_code: { companyId: company.id, code: "HO" } },
    update: {},
    create: { companyId: company.id, name: "Head Office", code: "HO" },
  });

  await prisma.counter.upsert({
    where: { companyId_key: { companyId: company.id, key: "customer" } },
    update: {},
    create: { companyId: company.id, key: "customer", value: 0 },
  });

  const allPermissions = await prisma.permission.findMany();
  const permissionIdByCode = new Map(allPermissions.map((p) => [p.code, p.id]));

  const roleByName = new Map<SystemRoleName, { id: string }>();
  for (const roleName of SYSTEM_ROLE_NAMES) {
    const role = await prisma.role.upsert({
      where: { companyId_name: { companyId: company.id, name: roleName } },
      update: {},
      create: { companyId: company.id, name: roleName, isSystem: true },
    });
    roleByName.set(roleName, role);

    for (const code of ROLE_GRANTS[roleName]) {
      const permissionId = permissionIdByCode.get(code);
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }
  }

  return { company, branch, roleByName };
}

async function seedSuperAdmin(companyId: string, branchId: string, roleId: string) {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@xpure.dev";
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password) {
    console.warn(
      "SEED_ADMIN_PASSWORD not set — using an insecure dev default. Never rely on this outside local dev.",
    );
  }
  const passwordHash = await hash(password ?? "ChangeMe123!");

  await prisma.user.upsert({
    where: { companyId_email: { companyId, email } },
    update: {},
    create: {
      companyId,
      branchId,
      roleId,
      email,
      passwordHash,
      firstName: "Super",
      lastName: "Admin",
      status: "ACTIVE",
    },
  });

  return email;
}

async function seedDemoStaffUser(companyId: string, branchId: string, roleId: string) {
  const email = "support@xpure.dev";
  const passwordHash = await hash("Demo123!");
  await prisma.user.upsert({
    where: { companyId_email: { companyId, email } },
    update: {},
    create: {
      companyId,
      branchId,
      roleId,
      email,
      passwordHash,
      firstName: "Demo",
      lastName: "Support",
      status: "ACTIVE",
    },
  });
  return email;
}

async function seedDemoData(companyId: string, branchId: string) {
  const products = [
    { sku: "BTL-19L", name: "19L Bottle", unitPrice: 250, depositAmount: 2000 },
    { sku: "BTL-12PK", name: "12L Bottle Pack", unitPrice: 180, depositAmount: 1000 },
    { sku: "DISP-STD", name: "Standard Dispenser", unitPrice: 6500, depositAmount: 0, isReturnable: false },
  ];
  for (const product of products) {
    await prisma.product.upsert({
      where: { companyId_sku: { companyId, sku: product.sku } },
      update: {},
      create: { companyId, ...product },
    });
  }

  const demoCustomers: Array<{
    name: string;
    phone: string;
    customerType: "RESIDENTIAL" | "COMMERCIAL" | "SCHOOL" | "HOSPITAL" | "RESTAURANT";
    area: string;
    city: string;
  }> = [
    { name: "Ahmed Raza", phone: "0300-1234567", customerType: "RESIDENTIAL", area: "F-10", city: "Islamabad" },
    { name: "Zainab Hussain", phone: "0301-2345678", customerType: "RESIDENTIAL", area: "DHA Phase 5", city: "Karachi" },
    { name: "Crescent Textiles", phone: "042-35678901", customerType: "COMMERCIAL", area: "Gulberg", city: "Lahore" },
    { name: "Riverside School System", phone: "051-8765432", customerType: "SCHOOL", area: "G-9", city: "Islamabad" },
    { name: "City Care Hospital", phone: "021-34567890", customerType: "HOSPITAL", area: "Clifton", city: "Karachi" },
  ];

  for (const customer of demoCustomers) {
    const sequence = await nextSequence(companyId, "customer");
    const customerCode = `CUS-${String(sequence).padStart(4, "0")}`;
    await prisma.customer.upsert({
      where: { companyId_customerCode: { companyId, customerCode } },
      update: {},
      create: {
        companyId,
        branchId,
        customerCode,
        status: "ACTIVE",
        ...customer,
      },
    });
  }
}

async function main() {
  console.log("Seeding permission catalog...");
  await seedPermissionCatalog();

  console.log("Seeding company, branch, and roles...");
  const { company, branch, roleByName } = await seedCompanyAndRoles();

  const superAdminRole = roleByName.get("Super Admin");
  if (!superAdminRole) throw new Error("Super Admin role failed to seed");

  const adminEmail = await seedSuperAdmin(company.id, branch.id, superAdminRole.id);
  console.log(`Seeded Super Admin user: ${adminEmail}`);

  if (process.env.SEED_DEMO_DATA !== "false") {
    console.log("Seeding demo products and customers...");
    await seedDemoData(company.id, branch.id);

    const customerSupportRole = roleByName.get("Customer Support");
    if (customerSupportRole) {
      const supportEmail = await seedDemoStaffUser(company.id, branch.id, customerSupportRole.id);
      console.log(`Seeded demo Customer Support user: ${supportEmail} (password: Demo123!) — a lower-privilege login for testing RBAC boundaries.`);
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
