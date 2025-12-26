# Clustering API Documentation

This document describes the database schema and query patterns for integrating the community clustering data into a frontend application.

## Overview

The clustering system detects communities (groups of addresses that frequently transact with each other) in the P2P transfer network using the Louvain algorithm. It runs weekly and tracks how communities evolve over time through stable cluster IDs.

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Community** | A group of addresses detected by Louvain as frequently transacting together |
| **Stable Cluster ID** | A persistent identifier that tracks a community across weeks, even as membership changes |
| **P2P Tier** | Classification of transfer type: Tier 1 (EOA-to-EOA), Tier 2 (includes smart wallets), Tier 3 (broader) |
| **Week Start** | ISO week start date (Monday) used as the temporal key |

## Database Schema

All tables are in the `analytics` schema.

### Tables Overview

```
analytics.cluster_runs              -- Algorithm parameters (for reproducibility)
analytics.stable_clusters           -- Persistent cluster identities
analytics.cluster_instances_weekly  -- Community snapshots with metrics
analytics.cluster_members_weekly    -- Node-to-cluster assignments
analytics.cluster_transitions_weekly -- Week-over-week evolution
analytics.address_labels            -- Address exclusions and labels
```

---

## Table Schemas

### `analytics.cluster_instances_weekly`

Main table for dashboard community views. One row per community per week.

| Column | Type | Description |
|--------|------|-------------|
| `week_start` | DATE | ISO week start (Monday) |
| `token_id` | INTEGER | Foreign key to `tokens.id` |
| `chain_id` | INTEGER | Foreign key to `chains.id` |
| `p2p_tier` | SMALLINT | 1, 2, or 3 |
| `run_id` | BIGINT | Reference to clustering run parameters |
| `community_label` | INTEGER | Raw Louvain label (arbitrary, changes each run) |
| `stable_cluster_id` | BIGINT | **Use this for tracking across weeks** |
| `node_count` | BIGINT | Number of addresses in the community |
| `edge_count` | BIGINT | Number of edges within the community |
| `total_weight` | NUMERIC | Total edge weight (volume or tx_count) |
| `internal_weight` | NUMERIC | Weight of edges within the community |
| `external_weight` | NUMERIC | Weight of edges to other communities |
| `top_node_address` | VARCHAR(42) | Highest-degree address |
| `top_node_weight` | NUMERIC | Weight of top node |
| `computed_at` | TIMESTAMP | When this was computed |

**Primary Key:** `(week_start, token_id, chain_id, p2p_tier, run_id, community_label)`

### `analytics.cluster_members_weekly`

Node-level membership data. One row per address per week.

| Column | Type | Description |
|--------|------|-------------|
| `week_start` | DATE | ISO week start (Monday) |
| `token_id` | INTEGER | Foreign key to `tokens.id` |
| `chain_id` | INTEGER | Foreign key to `chains.id` |
| `p2p_tier` | SMALLINT | 1, 2, or 3 |
| `run_id` | BIGINT | Reference to clustering run |
| `address` | VARCHAR(42) | Ethereum address (lowercase) |
| `community_label` | INTEGER | Raw Louvain label |
| `stable_cluster_id` | BIGINT | **Use this for tracking** |
| `degree` | BIGINT | Number of edges (connections) |
| `in_weight` | NUMERIC | Sum of incoming edge weights |
| `out_weight` | NUMERIC | Sum of outgoing edge weights |
| `total_weight` | NUMERIC | in_weight + out_weight |

**Primary Key:** `(week_start, token_id, chain_id, p2p_tier, run_id, address)`

### `analytics.cluster_transitions_weekly`

Tracks how communities evolve week-over-week. Use for split/merge analysis.

| Column | Type | Description |
|--------|------|-------------|
| `prev_week_start` | DATE | Previous week |
| `week_start` | DATE | Current week |
| `token_id` | INTEGER | Foreign key to `tokens.id` |
| `chain_id` | INTEGER | Foreign key to `chains.id` |
| `p2p_tier` | SMALLINT | 1, 2, or 3 |
| `prev_stable_cluster_id` | BIGINT | Parent cluster from previous week |
| `stable_cluster_id` | BIGINT | Child cluster in current week |
| `intersection_nodes` | BIGINT | Number of shared addresses |
| `jaccard` | NUMERIC | Jaccard similarity: \|A ∩ B\| / \|A ∪ B\| |
| `overlap_prev` | NUMERIC | Fraction of prev cluster: \|A ∩ B\| / \|prev\| |
| `overlap_new` | NUMERIC | Fraction of new cluster: \|A ∩ B\| / \|new\| |
| `is_primary` | BOOLEAN | TRUE if this is the best match |

### `analytics.stable_clusters`

Registry of all stable cluster IDs.

| Column | Type | Description |
|--------|------|-------------|
| `stable_cluster_id` | BIGSERIAL | Primary key |
| `token_id` | INTEGER | Token this cluster belongs to |
| `chain_id` | INTEGER | Chain this cluster belongs to |
| `p2p_tier` | SMALLINT | P2P tier (1, 2, or 3) |
| `created_week_start` | DATE | When this cluster first appeared |
| `created_at` | TIMESTAMP | Timestamp of creation |

### `analytics.address_labels`

Known addresses with exclusion flags. Use for filtering or displaying labels.

| Column | Type | Description |
|--------|------|-------------|
| `chain_id` | INTEGER | Chain ID |
| `address` | VARCHAR(42) | Ethereum address (lowercase) |
| `category` | VARCHAR(32) | `dex_pool`, `dex_router`, `bridge`, `token_contract`, `cex`, `protocol`, `other` |
| `label` | TEXT | Human-readable label |
| `exclude_from_p2p` | BOOLEAN | If TRUE, excluded from P2P tier classification |
| `exclude_from_clustering` | BOOLEAN | If TRUE, excluded from clustering analysis |
| `source` | VARCHAR(32) | `manual`, `auto_pool`, `auto_token`, etc. |

---

## Common Query Patterns

### 1. Get all communities for a token/chain/tier in a specific week

```sql
SELECT
    ci.stable_cluster_id,
    ci.node_count,
    ci.edge_count,
    ci.total_weight,
    ci.internal_weight,
    ci.external_weight,
    ci.top_node_address,
    ci.top_node_weight
FROM analytics.cluster_instances_weekly ci
WHERE ci.token_id = 1           -- wARS
  AND ci.chain_id = 3           -- worldchain
  AND ci.p2p_tier = 2
  AND ci.week_start = '2024-12-16'
ORDER BY ci.node_count DESC;
```

### 2. Get community size over time (for a specific stable_cluster_id)

```sql
SELECT
    week_start,
    node_count,
    edge_count,
    total_weight
FROM analytics.cluster_instances_weekly
WHERE stable_cluster_id = 42
ORDER BY week_start;
```

### 3. Get all members of a community in a specific week

```sql
SELECT
    cm.address,
    cm.degree,
    cm.in_weight,
    cm.out_weight,
    cm.total_weight,
    al.label,
    al.category
FROM analytics.cluster_members_weekly cm
LEFT JOIN analytics.address_labels al
    ON al.chain_id = cm.chain_id AND al.address = cm.address
WHERE cm.stable_cluster_id = 42
  AND cm.week_start = '2024-12-16'
ORDER BY cm.total_weight DESC;
```

### 4. Get weekly community summary with token/chain names

```sql
SELECT
    ci.week_start,
    t.symbol AS token,
    c.name AS chain,
    ci.p2p_tier,
    COUNT(*) AS community_count,
    SUM(ci.node_count) AS total_nodes,
    SUM(ci.edge_count) AS total_edges
FROM analytics.cluster_instances_weekly ci
JOIN tokens t ON t.id = ci.token_id
JOIN chains c ON c.id = ci.chain_id
GROUP BY ci.week_start, t.symbol, c.name, ci.p2p_tier
ORDER BY ci.week_start DESC, t.symbol, c.name, ci.p2p_tier;
```

### 5. Find which community an address belongs to

```sql
SELECT
    cm.week_start,
    cm.stable_cluster_id,
    ci.node_count AS cluster_size,
    cm.degree,
    cm.total_weight
FROM analytics.cluster_members_weekly cm
JOIN analytics.cluster_instances_weekly ci
    ON ci.week_start = cm.week_start
   AND ci.token_id = cm.token_id
   AND ci.chain_id = cm.chain_id
   AND ci.p2p_tier = cm.p2p_tier
   AND ci.run_id = cm.run_id
   AND ci.stable_cluster_id = cm.stable_cluster_id
WHERE cm.address = '0x1234...'
  AND cm.token_id = 1
  AND cm.chain_id = 3
ORDER BY cm.week_start DESC;
```

### 6. Detect community splits (one parent → multiple children)

```sql
SELECT
    prev_stable_cluster_id AS parent_cluster,
    week_start,
    COUNT(*) AS child_count,
    ARRAY_AGG(stable_cluster_id) AS child_clusters,
    ARRAY_AGG(intersection_nodes) AS overlaps
FROM analytics.cluster_transitions_weekly
WHERE token_id = 1 AND chain_id = 3 AND p2p_tier = 2
GROUP BY prev_stable_cluster_id, week_start
HAVING COUNT(*) > 1
ORDER BY week_start DESC;
```

### 7. Detect community merges (multiple parents → one child)

```sql
SELECT
    stable_cluster_id AS merged_cluster,
    week_start,
    COUNT(*) AS parent_count,
    ARRAY_AGG(prev_stable_cluster_id) AS parent_clusters,
    ARRAY_AGG(intersection_nodes) AS overlaps
FROM analytics.cluster_transitions_weekly
WHERE token_id = 1 AND chain_id = 3 AND p2p_tier = 2
GROUP BY stable_cluster_id, week_start
HAVING COUNT(*) > 1
ORDER BY week_start DESC;
```

### 8. Get new communities created each week

```sql
SELECT
    sc.created_week_start,
    COUNT(*) AS new_clusters
FROM analytics.stable_clusters sc
WHERE sc.token_id = 1 AND sc.chain_id = 3 AND sc.p2p_tier = 2
GROUP BY sc.created_week_start
ORDER BY sc.created_week_start;
```

### 9. Get top communities by size across all weeks

```sql
SELECT DISTINCT ON (ci.stable_cluster_id)
    ci.stable_cluster_id,
    ci.week_start AS latest_week,
    ci.node_count,
    ci.total_weight,
    sc.created_week_start AS first_seen
FROM analytics.cluster_instances_weekly ci
JOIN analytics.stable_clusters sc ON sc.stable_cluster_id = ci.stable_cluster_id
WHERE ci.token_id = 1 AND ci.chain_id = 3 AND ci.p2p_tier = 2
ORDER BY ci.stable_cluster_id, ci.week_start DESC;
```

### 10. Community growth rate (week-over-week)

```sql
WITH weekly_sizes AS (
    SELECT
        stable_cluster_id,
        week_start,
        node_count,
        LAG(node_count) OVER (PARTITION BY stable_cluster_id ORDER BY week_start) AS prev_node_count
    FROM analytics.cluster_instances_weekly
    WHERE token_id = 1 AND chain_id = 3 AND p2p_tier = 2
)
SELECT
    stable_cluster_id,
    week_start,
    node_count,
    prev_node_count,
    CASE
        WHEN prev_node_count > 0
        THEN ROUND((node_count - prev_node_count)::numeric / prev_node_count * 100, 2)
        ELSE NULL
    END AS growth_pct
FROM weekly_sizes
WHERE prev_node_count IS NOT NULL
ORDER BY week_start DESC, growth_pct DESC NULLS LAST;
```

---

## Reference Data

### Token IDs

Query current tokens:
```sql
SELECT id, symbol, name FROM tokens ORDER BY id;
```

### Chain IDs

Query current chains:
```sql
SELECT id, name FROM chains ORDER BY id;
```

### P2P Tiers

| Tier | Description |
|------|-------------|
| 1 | EOA-to-EOA transfers (strictest) |
| 2 | Includes smart contract wallets (recommended) |
| 3 | Broader definition |

---

## Notes for Frontend Integration

### Stable Cluster ID vs Community Label

- **Always use `stable_cluster_id`** for tracking communities across weeks
- `community_label` is an arbitrary integer assigned by Louvain each run and will change
- `stable_cluster_id` is persistent and tracks the same community over time

### Weight Interpretation

- Weights are stored as raw blockchain values (18 decimals for most tokens)
- Divide by `10^18` to get human-readable amounts
- Example: `total_weight = 1000000000000000000` = 1.0 token

### Date Handling

- All `week_start` values are ISO week starts (Mondays)
- Weeks are continuous; gaps indicate no activity that week
- Use `generate_series()` to fill gaps if needed

### Performance Tips

- Always filter by `token_id`, `chain_id`, and `p2p_tier` first
- Use `week_start` ranges to limit data
- The tables have indexes optimized for these patterns
- For large result sets, use LIMIT/OFFSET or cursor pagination

### Excluded Addresses

Addresses in `analytics.address_labels` with `exclude_from_clustering = TRUE` are NOT included in the clustering analysis. These typically include:
- DEX pools
- DEX routers
- Bridge contracts
- Known protocol addresses

You can join with `address_labels` to display labels for known addresses in the UI.
