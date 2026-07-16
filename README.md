# X-Pure — Water Delivery Management System

Monorepo for the WDMS admin panel + API.

## Stack

- **apps/api** — NestJS, PostgreSQL + Prisma, Redis, JWT auth, RBAC
- **apps/admin** — Next.js (App Router), Tailwind, shadcn/ui
- **packages/database** — Prisma schema, migrations, seed
- **packages/types** — shared zod schemas + permission catalog
- **packages/config** — shared eslint/tsconfig/tailwind presets

## Getting started

```bash
corepack enable
pnpm install
cp .env.example .env

docker compose up -d        # postgres + redis
pnpm db:migrate              # create tables
pnpm db:seed                  # seed roles/permissions/demo data

pnpm dev                      # runs api (:3001) + admin (:3000)
```

- API docs: http://localhost:3001/api/docs
- API health: http://localhost:3001/health
- Admin panel: http://localhost:3000 (log in with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from `.env`)

## Scope of this scaffold

Auth, RBAC, and the full domain schema backbone are in place. **Customers** is the one fully built end-to-end module (API CRUD + admin UI) — the reference pattern for building out the remaining modules (Orders, Products, Inventory, Bottle Security, Payments, Complaints, Employees, Routes, Reports, Settings), which currently appear in the admin nav as empty-state placeholders.

## Full guide

See **[docs/GUIDE.md](docs/GUIDE.md)** for the complete cheat sheet: commands, environment variables, seeded logins, architecture notes, a step-by-step recipe for building the next module, troubleshooting, zero-cost deployment options, and the suggested roadmap.
