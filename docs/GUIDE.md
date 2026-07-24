# X-Pure WDMS — Project Guide & Cheat Sheet

Everything you need to run and extend this project.

## What's actually built

| Area | Status |
|---|---|
| Single Next.js full-stack app (App Router, server actions, Prisma) | ✅ Done |
| Postgres schema (tenancy, RBAC, customers, + backbone for orders/products/bottles/payments/complaints) | ✅ Done |
| Auth (DB-backed cookie sessions, argon2 passwords) | ✅ Done |
| RBAC (8 roles, ~45 permissions, checked in pages/actions, nav filtered per role) | ✅ Done |
| Theme (light default, light/dark/system toggle in the topbar) | ✅ Done |
| **Customers** — list/detail/create/edit/delete/export (the reference pattern) | ✅ Done |
| **Products**, **Routes**, **Employees** — full CRUD (dialog-based) | ✅ Done |
| **Orders** — line-item builder, computed totals, status workflow, bottle-issue on delivery | ✅ Done |
| **Payments** — record against orders/customers, auto-recomputes order payment status | ✅ Done |
| **Bottle Security** — per-customer bottle + deposit balances, ledger entry recording | ✅ Done |
| **Complaints** — log/prioritize/assign/resolve | ✅ Done |
| **Inventory** — read-only product sales + circulation overview (no stock table in schema) | ✅ Done |
| **Reports** — read-only revenue/orders/payments/top-customers, CSV export | ✅ Done |
| **Settings** — company profile + branch CRUD | ✅ Done |
| Deployment | ⬜ Not deployed — runs locally via Docker Compose |

Every nav module is built. The pattern per module: `lib/<module>/queries.ts` (reads),
`lib/<module>/actions.ts` (`"use server"` writes with RBAC + zod), `lib/schemas/<module>.schema.ts`
(shared zod), a server page under `app/(dashboard)/<module>/`, and client components under
`components/<module>/`. Simple entities use a dialog form; Orders uses dedicated pages for its
line-item builder.

## Quick start

Prerequisites: Node 20+, Docker (for Postgres), corepack.

```bash
corepack enable
pnpm install
cp .env.example .env         # edit values if you want different secrets

docker compose up -d         # postgres only
pnpm db:migrate              # first time / after schema changes
pnpm db:seed                 # roles, permissions, demo customers, demo users

pnpm dev                     # http://localhost:3000
```

## Repo map

```
app/                    # routes (App Router)
  (auth)/login/         # public login page
  (dashboard)/          # authed shell: sidebar + topbar; one folder per module
    customers/          # the fully built reference module
    customers/export/   # CSV download (route handler)
components/
  ui/                   # shadcn/ui primitives
  layout/               # sidebar, topbar, user menu, theme toggle
  shared/               # data table, page header, empty state, confirm dialog
  customers/            # module-specific components
lib/
  db.ts                 # Prisma client singleton
  types.ts              # re-exports schemas + permission catalog
  permissions.ts        # RBAC catalog: modules × actions → "module.action" codes
  schemas/              # zod schemas (shared by forms and server actions)
  auth/                 # sessions (cookie ↔ refresh_tokens table), login/logout actions, user context
  customers/            # queries.ts (reads) + actions.ts (writes) for the module
prisma/                 # schema, migrations, seed
middleware.ts           # redirects to /login when the session cookie is missing
```

## Command cheat sheet

| Command | What it does |
|---|---|
| `pnpm dev` | Run the app on :3000 |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm lint` / `pnpm typecheck` | ESLint / `tsc --noEmit` |
| `pnpm db:migrate` | Create/apply a dev migration |
| `pnpm db:migrate:deploy` | Apply committed migrations (CI/prod) |
| `pnpm db:seed` | Seed roles, permissions, demo data (idempotent upserts) |
| `pnpm db:studio` | Prisma Studio DB browser |
| `docker compose --profile tools up -d adminer` | Adminer DB browser on :8080 |

## Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `POSTGRES_*` | Used by docker-compose to provision the local DB |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Super Admin created by `pnpm db:seed` |
| `SEED_DEMO_DATA` | `false` skips demo products/customers/support user |
| `NEXT_PUBLIC_APP_NAME` | Browser tab title |

## Seeded logins

| User | Email | Password | Role |
|---|---|---|---|
| Super Admin | `SEED_ADMIN_EMAIL` | `SEED_ADMIN_PASSWORD` | everything |
| Demo support | `support@xpure.dev` | `Demo123!` | Customer Support — for testing RBAC boundaries |

## Architecture in plain terms

- **No separate API.** Pages are server components that call `lib/<module>/queries.ts` directly.
  Writes go through server actions in `lib/<module>/actions.ts`. Both run on the server next to Prisma.
- **Auth**: logging in verifies the argon2 hash, stores a random token's sha256 in the
  `refresh_tokens` table, and sets it as an httpOnly `session` cookie. `getCurrentUser()`
  (cached per request) resolves cookie → user → role → permission codes.
- **RBAC**: `lib/permissions.ts` is the single source of truth. The seed upserts Permission rows
  from it, pages call `requirePermission("customers.view")`, actions check the matching code, and
  the sidebar hides nav items the role can't view.
- **Multi-tenancy**: every query filters by `companyId` from the session user. Login currently
  resolves "the" company (single tenant); a real multi-tenant login would resolve it per request.
- **Soft delete**: `Customer` rows get `deletedAt` set; all customer reads filter `deletedAt: null`.

## How to build the next module (using Customers as the template)

1. **Schema** — the domain model for Orders/Products/etc. already exists in `prisma/schema.prisma`.
   Only migrate if you need changes.
2. **Zod schemas** — add `lib/schemas/<module>.schema.ts` (create/update/query shapes), export from
   `lib/types.ts`.
3. **Queries** — `lib/<module>/queries.ts`: list (paginated, filtered by `companyId`), getById, any stats.
4. **Actions** — `lib/<module>/actions.ts`: `"use server"`, check permission via `getCurrentUser` +
   `hasPermission`, validate with zod, write with Prisma, `revalidatePath`.
5. **UI** — replace the module's `EmptyState` page with a server page that calls the queries, plus
   client components for table/filters/forms (copy the `components/customers/` pattern).
6. **Nav** — flip `implemented: true` in `components/layout/nav-items.ts`.

## Troubleshooting

- **`PrismaClientInitializationError`** — Postgres isn't up (`docker compose up -d`) or
  `DATABASE_URL` is wrong.
- **Login always fails** — did you run `pnpm db:seed`? Check `SEED_ADMIN_*` in `.env`.
- **Redirect loop on /login** — clear cookies for localhost:3000; a stale `session` cookie with a
  revoked DB row sends you to `/login`, which is public, so a loop means something else rewrote the cookie.
- **Schema drift** — `pnpm db:migrate` after editing `prisma/schema.prisma`; regenerate the client
  with `pnpm db:generate` if types look stale.

## Roadmap — suggested build order

1. **Products** (smallest CRUD, unlocks Orders)
2. **Orders** (core workflow: create → assign → deliver; drives bottle ledger entries)
3. **Payments** (record against orders; makes the Outstanding KPI real)
4. **Bottle Security** (ledger views; data comes from order delivery)
5. **Complaints**, **Employees**, **Routes**, **Reports**, **Settings**
