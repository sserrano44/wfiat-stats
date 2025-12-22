# wFiat Stats - Analytics Dashboard

Analytics dashboard for wFiat stablecoins (wARS, wBRL, wMXN, wCOP, wPEN, wCLP) across Ethereum, Base, and Worldchain.

## Features

- **Overview Page**: Net issuance, minted/burned volumes, P2P activity, DEX trading metrics
- **P2P Page**: Tier 1/2 transfer metrics, share analysis, top address pairs
- **Network Page**: Weekly graph KPIs (nodes, edges, LCC, reciprocity), top corridors
- **DEX Page**: Trade volume, unique traders, transfer-to-trade ratios

## Prerequisites

- Node.js 20+
- PostgreSQL 12+ with the wFiat database schema
- Analytics tables populated (see DATABASE.md for schema details)

## Required Database Tables

### Core tables
- `tokens` - Token registry (wARS, wBRL, etc.)
- `chains` - Chain registry (ethereum, base, worldchain)
- `transfers` - ERC-20 transfer events
- `trades` - DEX swap events

### Analytics tables (in `analytics` schema)
- `analytics.metrics_daily` - Daily aggregated metrics
- `analytics.edges_weekly` - Weekly P2P transfer pairs
- `analytics.network_weekly` - Weekly network graph KPIs

If analytics tables don't exist, the dashboard will show an error message.

## Environment Variables

Create a `.env` file (see `.env.example`):

```
DATABASE_URL=postgresql://user:password@host:port/database
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Project Structure

```
app/
  (dashboard)/          # Dashboard pages with shared layout
    overview/           # Main overview page
    p2p/               # P2P transfer analytics
    network/           # Network graph analysis
    dex/               # DEX trading metrics
  api/                 # API routes
    filters/           # Token/chain lookups
    overview/          # Overview data
    network/           # Network KPIs
    p2p/               # P2P metrics
    dex/               # DEX metrics

lib/
  server/              # Server-only code
    db.ts              # PostgreSQL connection pool
    queries/           # Database query modules
  types/               # TypeScript types
  validation/          # Zod schemas
  utils/               # Formatting utilities

components/
  layout/              # Dashboard shell, sidebar, header
  filters/             # Filter bar components
  charts/              # Recharts wrappers
  cards/               # KPI metric cards
  tables/              # Data tables
  ui/                  # Basic UI components
```

## API Endpoints

| Endpoint | Description | Cache |
|----------|-------------|-------|
| `GET /api/filters` | Token/chain options | 1 hour |
| `GET /api/overview?token=&chain=&range=` | Overview metrics | 5 min |
| `GET /api/p2p?token=&chain=&range=&tier=` | P2P metrics + top pairs | 5 min |
| `GET /api/network?token=&chain=&range=&tier=&week=` | Network KPIs + corridors | 5 min |
| `GET /api/dex?token=&chain=&range=` | DEX metrics | 5 min |

### Query Parameters

- `token`: wARS, wBRL, wMXN, wCOP, wPEN, wCLP (default: all)
- `chain`: ethereum, base, worldchain (default: all)
- `range`: 7d, 30d, 90d, 180d, 365d (default: 30d)
- `tier`: 1, 2, 3 (P2P tier filter)
- `week`: ISO date for network corridors

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with pg driver
- **Charts**: Recharts
- **Styling**: Tailwind CSS v4
- **Data Fetching**: SWR
- **Validation**: Zod

## Security Notes

- Database connection is server-only (never exposed to client)
- All queries use parameterized statements (no SQL injection)
- DATABASE_URL is never logged
- Read-only database access (no writes/migrations)
