# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start development server at localhost:3000
pnpm build        # Production build
pnpm lint         # Run ESLint
```

## Architecture

This is a Next.js 16 analytics dashboard for wFiat stablecoins (wARS, wBRL, wMXN, wCOP, wPEN, wCLP) on Ethereum, Base, and Worldchain.

### Data Flow

1. **Database Layer** (`lib/server/`) - Server-only PostgreSQL queries using `pg` driver
   - `db.ts` - Connection pool singleton, parameterized query helper, value scaling
   - `queries/` - Domain-specific query modules (overview, p2p, network, dex, filters)

2. **API Layer** (`app/api/`) - Next.js route handlers
   - Validate params with Zod schemas from `lib/validation/`
   - Call query functions from `lib/server/queries/`
   - Return typed responses from `lib/types/api.ts`
   - 5-minute cache (revalidate=300), 1-hour for filters

3. **Client Layer** (`hooks/`) - SWR-based data fetching
   - `useFilters.ts` - URL-based filter state (token, chain, range, tier)
   - `useDashboardData.ts` - SWR hooks for each API endpoint

4. **UI Layer** (`components/`, `app/(dashboard)/`)
   - Dashboard pages under `app/(dashboard)/` share layout with sidebar
   - Filter components sync with URL search params
   - Charts use Recharts wrappers in `components/charts/`

### Key Patterns

- **Server-only imports**: `lib/server/` uses `import "server-only"` to prevent client bundling
- **Filter state**: URL search params are the source of truth; `useFilters` hook reads/writes them
- **Path alias**: `@/*` maps to project root
- **React Compiler**: Enabled in next.config.ts

### Database Schema

Requires PostgreSQL with analytics schema:
- `tokens`, `chains`, `transfers`, `trades` - Core tables
- `analytics.metrics_daily`, `analytics.edges_weekly`, `analytics.network_weekly` - Precomputed analytics

## Environment

Requires `DATABASE_URL` in `.env` pointing to PostgreSQL database with analytics tables populated.
