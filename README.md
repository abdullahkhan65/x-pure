# X-Pure — Water Delivery Management System

Single full-stack Next.js app: App Router UI + server actions + Prisma/PostgreSQL in one codebase.

## Stack

- **Next.js 15** (App Router) — pages are server components; mutations are server actions
- **PostgreSQL + Prisma** — full domain schema (tenancy, RBAC, customers, orders, payments, …)
- **Cookie sessions** — httpOnly session cookie backed by the DB (no JWT, no Redis)
- **Tailwind + shadcn/ui** — light theme by default with a light/dark/system toggle

## Getting started

```bash
corepack enable
pnpm install
cp .env.example .env

docker compose up -d         # postgres
pnpm db:migrate              # create tables
pnpm db:seed                 # seed roles/permissions/demo data

pnpm dev                     # app on http://localhost:3000
```

Log in with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from `.env`.

## Scope

Auth, RBAC, and the full domain schema are in place, and every nav module is now built end-to-end
(queries + server actions + UI): Dashboard, Customers, Orders, Products, Inventory, Bottle Security,
Payments, Complaints, Employees, Routes, Reports, and Settings. Each module gates its pages and
actions on RBAC permissions and scopes every query to the signed-in user's company.

A few modules are intentionally read-only: **Inventory** is a product sales/circulation overview
(the schema has no stock-level table), and **Reports** is aggregate analytics. Everything else is
full CRUD.

## Full guide

See **[docs/GUIDE.md](docs/GUIDE.md)** for commands, environment variables, seeded logins,
architecture notes, and the step-by-step recipe for building the next module.
