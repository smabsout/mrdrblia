# My Collection — Price Guide MVP

A full-stack collectibles price guide and collection tracker with a comp-based valuation engine. Admins catalog items and enter verified historical sale records. The engine computes defensible low/median/high price estimates using exponential decay weighting and condition segmentation — no AI-generated prices. Every number links back to the real sale records that produced it.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/price-guide run dev` — run the frontend (port 18565, served at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Required environment variables

- `DATABASE_URL` — Postgres connection string (auto-provisioned by Replit)
- `SESSION_SECRET` — secret for express-session cookie signing

## Seed / Admin access

- Admin email: `admin@priceguide.com` / password: `password123`
- 8 approved items seeded across 3 categories (Sports Memorabilia, Entertainment, Historical Documents)
- 21 sale records seeded; 19 verified (powers Tier A/B valuations)
- Tier A items: Babe Ruth baseball, Michael Jordan jersey, Willie Mays glove, Marilyn Monroe lobby card, Beatles Abbey Road album
- Tier B items: Al Capone letter (comp-based via Dillinger card), Dillinger FBI card
- Tier C items: Bonnie Parker poem (no data)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + wouter + Recharts
- Backend: Express 5 + express-session (email/password auth, bcrypt)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (v3), drizzle-zod
- API codegen: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- Cron: node-cron (nightly Tier B recompute at 02:00)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle table definitions (users, items, sales, comp_matches, valuation_cache, watchlist)
- `artifacts/api-server/src/lib/valuation.ts` — **core valuation engine** (comp-based, never LLM-generated prices)
- `artifacts/api-server/src/routes/` — Express route handlers (auth, items, valuation, watchlist, admin, stats)
- `artifacts/price-guide/src/` — React frontend

## Architecture decisions

- **No AI-generated prices.** The valuation engine is pure rule-based math: exponential decay weighting (half-life 180 days), condition × authentication segmentation, weighted percentile for low/median/high. LLM is reserved for description normalization and similarity matching only (not yet implemented in MVP).
- **Audit trail is non-negotiable.** Every price estimate links back to the exact sale records that produced it via the "Show Your Work" panel on item detail.
- **Valuations are cached** in `valuation_cache` and recomputed on sale insert/verify, plus nightly via cron for Tier B items.
- **Items default to `status = 'pending'`** and are invisible to public until an admin approves them.
- **Verified flag is admin-only.** The `verified` column on sales is never set automatically — only via `PATCH /api/admin/sales/:id/verify`.
- **Zod v3 in OpenAPI spec.** Use `type: number` (not `type: integer`) in openapi.yaml — Orval 8.x generates `zod.int()` for integer fields which is Zod v4 syntax, incompatible with workspace's `zod@^3.x`.

## Gotchas

- After any `lib/api-spec/openapi.yaml` change, run codegen: `pnpm --filter @workspace/api-spec run codegen`
- After any `lib/db/src/schema/` change, run: `pnpm --filter @workspace/db run push`
- After changing `lib/*` packages, run: `pnpm run typecheck:libs`
- Do NOT use `type: integer` in openapi.yaml (Zod v3 incompatibility — see Architecture decisions)
- bcrypt requires approved builds in pnpm: ensured via `.npmrc` `onlyBuiltDependencies`

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._
