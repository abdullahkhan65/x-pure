# X-Pure WDMS — Project Guide & Cheat Sheet

Everything you need to run, extend, and eventually ship this project — without spending money.

## Table of contents

1. [What's actually built](#whats-actually-built)
2. [Quick start](#quick-start)
3. [Repo map](#repo-map)
4. [Command cheat sheet](#command-cheat-sheet)
5. [Environment variables](#environment-variables)
6. [Seeded logins](#seeded-logins)
7. [Architecture in plain terms](#architecture-in-plain-terms)
8. [How to build the next module (using Customers as the template)](#how-to-build-the-next-module)
9. [Troubleshooting](#troubleshooting)
10. [Deploying without spending money](#deploying-without-spending-money)
11. [Roadmap — suggested build order](#roadmap--suggested-build-order)

---

## What's actually built

Be precise about this so nothing gets assumed later:

| Area | Status |
|---|---|
| Monorepo (pnpm + Turborepo), shared config/types/database packages | ✅ Done |
| Postgres schema (tenancy, RBAC, customers, + backbone for orders/products/bottles/payments/complaints) | ✅ Done |
| Auth (JWT + rotating refresh tokens, httpOnly cookie) | ✅ Done |
| RBAC (8 roles, ~45 permissions, enforced by a guard) | ✅ Done |
| Tenant isolation (fail-loud Prisma guard) | ✅ Done |
| Audit logging (opt-in, on Customer writes) | ✅ Done |
| **Customers module** — API CRUD + admin UI (list/detail/create/edit/export) | ✅ Done — this is the reference pattern |
| Orders, Products, Inventory, Bottle Security, Payments, Complaints, Employees, Routes, Reports, Settings | ⬜ Schema-only or nav-only stub — **not built** |
| Public marketing website, customer portal, mobile apps, hardware integrations | ⬜ Not started (later PRD phases) |
| Deployment | ⬜ Not deployed anywhere — runs locally via Docker Compose |

If a page in the admin panel shows "module not built yet," that's accurate, not a bug.

---

## Quick start

Prerequisites: Node 22+, Docker Desktop (or any Docker engine), and `corepack` (ships with Node).

```bash
cd /Users/abdullah/Documents/x-pure

corepack enable
pnpm install

cp .env.example .env        # already done — edit values if you want different secrets

docker compose up -d postgres redis
pnpm db:migrate              # only needed the first time / after schema changes
pnpm db:seed                  # roles, permissions, demo customers, demo users

pnpm dev                      # runs API (:3001) + Admin (:3000) together
```

Then open:
- Admin panel: **http://localhost:3000** → log in with the seeded credentials below
- API docs (Swagger): **http://localhost:3001/api/docs**
- API health: **http://localhost:3001/health**

To stop everything: `Ctrl+C` the `pnpm dev` process, then `docker compose down` (add `-v` only if you want to wipe the database volume).

---

## Repo map

```
x-pure/
├── apps/
│   ├── api/                  NestJS backend
│   │   └── src/
│   │       ├── modules/customers/   ← the reference module, copy this for new modules
│   │       ├── modules/auth/         login/refresh/logout
│   │       ├── modules/rbac/         permission lookup
│   │       ├── common/                guards, decorators, filters, interceptors
│   │       └── prisma/                 the tenant-guarded PrismaService
│   └── admin/                Next.js admin panel (App Router)
│       ├── app/(auth)/login/
│       ├── app/(dashboard)/customers/   ← the reference module UI, copy this too
│       ├── app/(dashboard)/{orders,products,...}/  stub pages
│       ├── components/ui/                shadcn-style primitives (button, dialog, table, ...)
│       ├── components/customers/         form, table columns, stats cards, filters
│       ├── components/layout/            sidebar, topbar, nav-items.ts
│       ├── lib/auth/                      AuthProvider + in-memory token store
│       └── hooks/use-customers.ts         TanStack Query hooks
├── packages/
│   ├── database/       Prisma schema, migrations, seed script (@x-pure/database)
│   ├── types/            Shared zod schemas + permission catalog (@x-pure/types)
│   └── config/             Shared eslint/tsconfig/tailwind presets (@x-pure/config)
├── docker-compose.yml   Postgres + Redis (+ optional Adminer)
├── .github/workflows/ci.yml
└── docs/GUIDE.md        You are here.
```

**Why this layout matters:** `@x-pure/types` is the single source of truth for permission codes and zod validation schemas — it's imported by the seed script, the API's guard, the API's DTOs, and the admin forms. If you add a field to a Customer (or a new module), you generally start there.

---

## Command cheat sheet

Run from the repo root unless noted.

### Everyday dev
```bash
pnpm dev                        # API + Admin together (turbo)
pnpm --filter @x-pure/api dev    # just the API
pnpm --filter @x-pure/admin dev   # just the admin app
```

### Database
```bash
pnpm db:migrate                  # create/apply a migration (interactive, prompts for a name)
pnpm db:migrate:deploy            # apply existing migrations without prompting (CI/prod)
pnpm db:seed                       # re-run the seed (safe — uses upserts)
pnpm db:studio                      # opens Prisma Studio, a GUI to browse/edit data
pnpm db:generate                     # regenerate the Prisma client after schema changes
```
After editing `packages/database/prisma/schema.prisma`, always run `pnpm db:migrate` (dev) before the app will work — the Prisma client's TypeScript types are generated from the last migration.

### Quality gates (what CI runs)
```bash
pnpm lint
pnpm typecheck
pnpm test              # unit tests
pnpm --filter @x-pure/api test:e2e   # e2e tests — needs Postgres+Redis running
pnpm build
```

### Docker
```bash
docker compose up -d postgres redis     # start local infra
docker compose ps                        # check status
docker compose logs -f postgres           # tail logs
docker compose down                        # stop (keeps data)
docker compose down -v                      # stop AND wipe the database volume
docker compose --profile tools up -d adminer   # optional DB browser at localhost:8080
```

### Useful one-offs
```bash
# Reset the DB completely (drops + recreates + re-migrates + re-seeds)
docker compose down -v && docker compose up -d postgres redis && pnpm db:migrate && pnpm db:seed

# Inspect the audit log for what's been created/edited/deleted
docker exec x-pure-postgres-1 psql -U xpure -d xpure -c 'SELECT action, "entityType", "createdAt" FROM audit_logs ORDER BY "createdAt" DESC LIMIT 20;'
```

---

## Environment variables

All in `.env` at the repo root (copied from `.env.example`). Nothing here is a secret worth protecting in this local-only setup, but treat `JWT_ACCESS_SECRET` as sensitive once you deploy anywhere.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string used by Prisma |
| `REDIS_URL` | Redis connection string (health checks, rate limiting, future job queues) |
| `API_PORT` | NestJS port (default 3001) |
| `CORS_ORIGIN` | Allowed origin for direct (non-proxied) API calls |
| `JWT_ACCESS_SECRET` | Signs access tokens — **change this before any real deployment** |
| `JWT_ACCESS_TTL` | Access token lifetime (default 15m) |
| `JWT_REFRESH_TTL_DAYS` | Refresh token lifetime (default 30 days) |
| `COOKIE_DOMAIN` | Domain for the refresh-token cookie |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Credentials the seed script creates for the Super Admin |
| `SEED_DEMO_DATA` | Set to `false` to skip demo products/customers/support user |
| `NEXT_PUBLIC_APP_NAME` | Shown in the admin panel's title/header |
| `API_ORIGIN` | Where the admin app's Next.js rewrite proxies `/api/*` to |

---

## Seeded logins

| Role | Email | Password | Can do |
|---|---|---|---|
| Super Admin | `admin@xpure.dev` | `ChangeMe123!` | Everything |
| Customer Support (demo, restricted role) | `support@xpure.dev` | `Demo123!` | View/edit customers, full complaints access, **no delete** — good for testing that RBAC actually blocks things |

Both are created by `pnpm db:seed`. Change `SEED_ADMIN_PASSWORD` in `.env` before you seed a database that isn't purely local/throwaway.

---

## Architecture in plain terms

### Multi-tenancy
Every business record (`Customer`, `Order`, `Product`, etc.) carries a `companyId`. Right now there's exactly one seeded `Company` ("X-Pure Water Delivery") — but the schema is shaped so that selling this to a second water-delivery business later is a data change, not a schema rewrite. A Prisma extension (`apps/api/src/prisma/prisma.service.ts`) **throws an error** if any query on a tenant-scoped model is missing `companyId` — this is a safety net, not the primary mechanism; services are expected to pass `companyId` explicitly (see `CustomersService`).

### RBAC (permissions)
Permissions are `module.action` strings (e.g. `customers.delete`), defined once in `packages/types/src/permissions.ts`. Roles are rows in the database (`Role`, `Permission`, `RolePermission` tables), not hardcoded — so adding a "Custom Role" later through a UI is a data operation, not a code change. The API's `PermissionsGuard` checks these; the admin sidebar (`components/layout/nav-items.ts` + `sidebar.tsx`) filters using the exact same codes, so the nav and the enforcement can't drift apart.

### Auth flow
- Login → 15-minute access token (JWT, held only in React memory, never localStorage) + a long-lived refresh token (random string, stored **hashed** in the DB, delivered as an httpOnly cookie).
- The admin app's `next.config.ts` rewrites `/api/*` to the real API, so from the browser's point of view everything is same-origin — no CORS/cookie headaches.
- Refresh tokens rotate on every use. If a already-used (revoked) refresh token gets replayed, **every session for that user is revoked** — this is theft protection.

### Soft delete
Deleting a customer sets `deletedAt` instead of removing the row (same Prisma extension auto-filters deleted rows out of normal reads).

### Audit log
Not blanket — only specific handlers are decorated with `@Auditable("CUSTOMER_CREATED")`. Sensitive fields (`passwordHash`, `tokenHash`) are stripped before anything is written.

---

## How to build the next module

Customers is deliberately the **copy-paste template**. Here's the exact recipe to build, say, **Products** (already has a full Prisma model, just needs API + UI):

### 1. API side (`apps/api/src/modules/`)
1. `mkdir products && cp -r customers/* products/` then rename `customers` → `products` throughout (class names, decorators, file names).
2. In `packages/types/src/schemas/`, add `product.schema.ts` mirroring `customer.schema.ts` (Create/Update/Query/Response zod schemas) using the `Product` model's actual fields (`sku`, `name`, `unitPrice`, `depositAmount`, etc. — see `schema.prisma`).
3. Export the new schemas from `packages/types/src/index.ts`.
4. Rewrite `products.service.ts` against `prisma.client.product` — drop the `getStats()` aggregate logic (Products doesn't need it) or adapt it if useful.
5. Register `ProductsModule` in `apps/api/src/app.module.ts`.
6. The permission codes already exist — `products.view/create/edit/delete` are already seeded (see `packages/types/src/permissions.ts` → `MODULE_ACTIONS`), so no seed changes needed.

### 2. Admin UI side (`apps/admin/`)
1. `mkdir components/products && cp components/customers/* components/products/`, adapt fields.
2. `mkdir -p app/(dashboard)/products/{new,'[id]',[id]/edit}` and copy the four Customers page files, swap the hook imports.
3. Add a `hooks/use-products.ts` mirroring `use-customers.ts`.
4. Flip `implemented: false → true` for `products` in `components/layout/nav-items.ts`. That's the entire "make it appear as a real feature instead of an empty state" step.

### 3. Verify
```bash
pnpm --filter @x-pure/api test        # add a products.service.spec.ts alongside it
pnpm typecheck && pnpm lint && pnpm build
```
Then click through it in the browser exactly like we did for Customers: create → list → edit → delete → confirm a restricted role gets a 403.

Repeat this same recipe for Orders, Bottle Security, Payments, Complaints, etc. Orders is more involved (it references Customer, Product, DeliveryRoute, and writes to `OrderItem`/`BottleLedgerEntry` on creation) but the pattern — schema already exists → zod schema → service → controller → module registration → UI copy → flip the nav flag — is identical.

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `pnpm dev` API crashes with a Postgres connection error | Docker isn't running, or `docker compose up -d postgres redis` wasn't run. Check `docker compose ps`. |
| Admin app shows "Loading..." forever | API isn't running, or `.env`'s `API_ORIGIN` doesn't match where the API is listening. |
| Login works but refresh/logout 401s immediately | The refresh cookie has the wrong `path` or `domain`. It's currently set to `path: "/"` deliberately (see `auth.controller.ts`) so it survives the `/api/v1` prefix — don't narrow it without checking the actual mounted route first. |
| `[TenantGuard] ... is missing companyId` error | You wrote a new Prisma query on a tenant-scoped model without passing `companyId` in `where`/`data`. This is the safety net doing its job — add the `companyId`. |
| Prisma type errors after editing `schema.prisma` | Run `pnpm db:generate` (or `pnpm db:migrate`, which regenerates automatically). |
| `pnpm install` fails with `ERR_PNPM_IGNORED_BUILDS` | New dependency has a postinstall script pnpm is refusing to run for supply-chain safety. Review it, then add it to `allowBuilds` in `pnpm-workspace.yaml` (`true`/`false`). |
| Port already in use (3000/3001/5432/6379) | Something else on your machine is using it. Change the port in `.env` (API/Postgres/Redis) or stop the other process. |

---

## Deploying without spending money

**You don't need to deploy anything to keep building.** Everything above runs entirely on your machine via Docker Compose — that's genuinely $0, forever, with no account sign-ups. Treat deployment as optional and only do it once you actually want a shareable URL (e.g. to show someone, or to let real staff start using it).

When you do want that, here's a stack that's free with **no credit card required** as of early 2026 (verify current terms before signing up — free-tier policies change often):

| Piece | Free option | Notes |
|---|---|---|
| Postgres | **Neon** (neon.tech) | Serverless Postgres, generous free tier, no card. Swap `DATABASE_URL` — nothing else changes since it's still Postgres. |
| Redis | **Upstash** (upstash.com) | Serverless Redis, free tier is request-based (not always-on), no card. Swap `REDIS_URL`. |
| API (NestJS) | **Render** free web service | No card for the free tier. Caveat: free services **spin down after ~15 min idle** and take 30–60s to wake up on the next request — fine for a personal/demo deployment, not for something people rely on instantly. |
| Admin (Next.js) | **Vercel** Hobby tier | No card, very generous, built for Next.js specifically (zero-config). Officially for non-commercial/personal use — fine for now, revisit if this becomes a paid product. |

None of these require you to enter a card for the tiers described above — if a sign-up flow asks for one, that's a signal the "free" plan changed and you should stop and reconsider rather than assume it's still $0.

**A fully self-hosted, always-on, genuinely $0 alternative:** if you have a spare machine (old laptop, Raspberry Pi, mini PC) that can stay on, run the exact `docker-compose.yml` already in this repo on it, and expose it to the internet for free with a **Cloudflare Tunnel** (cloudflare.com — free tier, no port-forwarding, no dynamic-DNS hacks needed, gives you a real HTTPS domain). This avoids all third-party service limits and cold starts entirely, at the cost of your own hardware/uptime.

Whichever path: change `JWT_ACCESS_SECRET` and both seeded passwords to something real before anything is internet-reachable.

---

## Roadmap — suggested build order

In rough priority order, each following the ["How to build the next module"](#how-to-build-the-next-module) recipe:

1. **Products** — simplest next module (schema already exists, no dependencies on other unbuilt modules). Good warm-up.
2. **Orders** — the core of the business. Depends on Customer + Product (both exist) and writes to `OrderItem` + `BottleLedgerEntry` on creation. This is what makes the Dashboard's "Today's Orders" stop saying "Coming soon."
3. **Payments** — ties to Orders; unlocks real "Outstanding Balance" numbers on the Customer detail page (currently honestly shows 0 for everyone).
4. **Bottle Security** (deposit + bottle ledger) — one of the PRD's most emphasized modules; schema already models `BottleLedgerEntry` and `DepositLedgerEntry` separately on purpose.
5. **Complaints** — straightforward CRUD + status workflow, same shape as Customers.
6. **Employees** — extend `User` with an HR-detail table rather than replacing it (see the note in `schema.prisma`).
7. **Routes** — delivery zones/areas, assign customers + drivers.
8. **Reports** — once Orders/Payments/Bottle Security have real data, this becomes genuinely useful instead of aggregating zeros.
9. **Settings** — business profile, branches, taxes, pricing.
10. **Notification center, hardware integrations, customer portal, marketing website, mobile apps** — later PRD phases, deliberately deferred; nothing above blocks them, but nothing above needs them either.

Non-feature work worth doing opportunistically as the codebase grows:
- Add e2e/unit tests per new module (copy `customers.service.spec.ts` as the template).
- Once there's real traffic patterns, revisit the two things explicitly deferred as "good enough for now": RBAC lookup caching (currently a 60s in-process cache, not Redis) and tenant isolation (currently an explicit-companyId + fail-loud guard, not automatic via request context). Both are documented as intentional trade-offs in `apps/api/src/prisma/prisma.service.ts` and `apps/api/src/modules/rbac/rbac.service.ts`.
