# Database Schema

PostgreSQL database for storing wFiat stablecoin transfer data.

## Schema Overview

**Note on naming**: The `chain_id` column in `transfers`, `trades`, and `sync_state` is a foreign key referencing `chains.id` (the internal database ID), not `chains.chain_id` (the EVM chain ID like 1, 8453, 480).

```
┌─────────────┐     ┌──────────────────┐
│   tokens    │     │      chains      │
├─────────────┤     ├──────────────────┤
│ id (PK)     │     │ id (PK)          │
│ symbol      │     │ name             │
│ name        │     │ evm_chain_id     │  ← EVM chain ID (1, 8453, 480)
│ address     │     │ rpc_url_env      │
│ decimals    │     └────────┬─────────┘
└──────┬──────┘              │
       │                     │
       │    ┌────────────────┴────────────────┐
       │    │                                 │
       ▼    ▼                                 ▼
┌─────────────────────┐          ┌─────────────────────┐
│     transfers       │          │     sync_state      │
├─────────────────────┤          ├─────────────────────┤
│ id (PK)             │          │ id (PK)             │
│ chain_id (FK→id)    │          │ chain_id (FK→id)    │  ← references chains.id
│ token_id (FK)       │          │ token_id (FK)       │
│ tx_hash             │          │ last_block          │
│ log_index           │          │ updated_at          │
│ block_number        │          └─────────────────────┘
│ block_timestamp     │
│ from_address        │
│ to_address          │
│ value               │
│ transfer_type       │
└─────────────────────┘

┌─────────────────────┐
│       trades        │
├─────────────────────┤
│ id (PK)             │
│ chain_id (FK→id)    │  ← references chains.id
│ token_id (FK)       │
│ tx_hash             │
│ log_index           │
│ block_number        │
│ block_timestamp     │
│ dex_name            │
│ pool_address        │
│ trader_address      │
│ token_in_address    │
│ token_out_address   │
│ amount_in           │
│ amount_out          │
│ is_buy              │
└─────────────────────┘
```

## Tables

### tokens

Registry of tracked stablecoins.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| symbol | VARCHAR(10) | Token symbol (wARS, wBRL, etc.) |
| name | VARCHAR(50) | Full token name |
| address | VARCHAR(42) | Contract address (same across chains) |
| decimals | INTEGER | Token decimals (default: 18) |

### chains

Registry of supported blockchains.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key (used as FK in other tables) |
| name | VARCHAR(20) | Chain name (ethereum, base, worldchain) |
| chain_id | INTEGER | EVM chain ID (1, 8453, 480) |
| rpc_url_env | VARCHAR(50) | Environment variable name for RPC URL |

### transfers

All ERC-20 Transfer events for tracked tokens.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| chain_id | INTEGER | Foreign key to `chains.id` (not the EVM chain_id) |
| token_id | INTEGER | Foreign key to `tokens.id` |
| tx_hash | VARCHAR(66) | Transaction hash |
| log_index | INTEGER | Log index within transaction |
| block_number | BIGINT | Block number |
| block_timestamp | TIMESTAMP | Block timestamp (UTC) |
| from_address | VARCHAR(42) | Sender address |
| to_address | VARCHAR(42) | Recipient address |
| value | NUMERIC(78,0) | Transfer amount (wei) |
| transfer_type | VARCHAR(10) | 'mint', 'burn', or 'transfer' |

**Unique constraint**: (chain_id, tx_hash, log_index)

### trades

DEX swap events involving tracked tokens.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| chain_id | INTEGER | Foreign key to `chains.id` (not the EVM chain_id) |
| token_id | INTEGER | Foreign key to `tokens.id` |
| tx_hash | VARCHAR(66) | Transaction hash |
| log_index | INTEGER | Log index |
| block_number | BIGINT | Block number |
| block_timestamp | TIMESTAMP | Block timestamp (UTC) |
| dex_name | VARCHAR(50) | DEX name (Uniswap, Aerodrome, etc.) |
| pool_address | VARCHAR(42) | Liquidity pool address |
| trader_address | VARCHAR(42) | Address executing the swap |
| token_in_address | VARCHAR(42) | Token sold |
| token_out_address | VARCHAR(42) | Token bought |
| amount_in | NUMERIC(78,0) | Amount sold (wei) |
| amount_out | NUMERIC(78,0) | Amount bought (wei) |
| is_buy | BOOLEAN | True if buying wFiat token |

### sync_state

Tracks synchronization progress per token/chain pair.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| chain_id | INTEGER | Foreign key to `chains.id` (not the EVM chain_id) |
| token_id | INTEGER | Foreign key to `tokens.id` |
| last_block | BIGINT | Last synced block number |
| updated_at | TIMESTAMP | Last sync timestamp |

**Unique constraint**: (chain_id, token_id)

## Indexes

| Table | Index | Columns |
|-------|-------|---------|
| transfers | idx_transfers_block | chain_id, block_number |
| transfers | idx_transfers_token | token_id |
| transfers | idx_transfers_type | transfer_type |
| transfers | idx_transfers_from | from_address |
| transfers | idx_transfers_to | to_address |
| transfers | idx_transfers_timestamp | block_timestamp |
| trades | idx_trades_block | chain_id, block_number |
| trades | idx_trades_token | token_id |
| trades | idx_trades_trader | trader_address |
| trades | idx_trades_timestamp | block_timestamp |

## Example Queries

### Transfer statistics by token and chain

```sql
SELECT
    t.symbol,
    c.name AS chain,
    COUNT(*) FILTER (WHERE tr.transfer_type = 'transfer') AS transfers,
    COUNT(*) FILTER (WHERE tr.transfer_type = 'mint') AS mints,
    COUNT(*) FILTER (WHERE tr.transfer_type = 'burn') AS burns,
    SUM(tr.value) FILTER (WHERE tr.transfer_type = 'mint') / 1e18 AS total_minted,
    SUM(tr.value) FILTER (WHERE tr.transfer_type = 'burn') / 1e18 AS total_burned
FROM transfers tr
JOIN tokens t ON tr.token_id = t.id
JOIN chains c ON tr.chain_id = c.id
GROUP BY t.symbol, c.name
ORDER BY t.symbol, c.name;
```

### Daily transfer volume

```sql
SELECT
    DATE(block_timestamp) AS date,
    t.symbol,
    COUNT(*) AS transfer_count,
    SUM(value) / 1e18 AS volume
FROM transfers tr
JOIN tokens t ON tr.token_id = t.id
WHERE block_timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(block_timestamp), t.symbol
ORDER BY date DESC, t.symbol;
```

### Top addresses by transfer count

```sql
SELECT
    address,
    SUM(sent) AS total_sent,
    SUM(received) AS total_received,
    SUM(sent + received) AS total_transfers
FROM (
    SELECT from_address AS address, COUNT(*) AS sent, 0 AS received
    FROM transfers
    WHERE transfer_type = 'transfer'
    GROUP BY from_address
    UNION ALL
    SELECT to_address AS address, 0 AS sent, COUNT(*) AS received
    FROM transfers
    WHERE transfer_type = 'transfer'
    GROUP BY to_address
) sub
GROUP BY address
ORDER BY total_transfers DESC
LIMIT 20;
```

### Mint/burn history for a specific token

```sql
SELECT
    block_timestamp,
    c.name AS chain,
    transfer_type,
    CASE
        WHEN transfer_type = 'mint' THEN to_address
        ELSE from_address
    END AS address,
    value / 1e18 AS amount,
    tx_hash
FROM transfers tr
JOIN tokens t ON tr.token_id = t.id
JOIN chains c ON tr.chain_id = c.id
WHERE t.symbol = 'wARS'
  AND transfer_type IN ('mint', 'burn')
ORDER BY block_timestamp DESC
LIMIT 100;
```

### Net supply change over time

```sql
SELECT
    DATE(block_timestamp) AS date,
    t.symbol,
    SUM(CASE WHEN transfer_type = 'mint' THEN value ELSE 0 END) / 1e18 AS minted,
    SUM(CASE WHEN transfer_type = 'burn' THEN value ELSE 0 END) / 1e18 AS burned,
    (SUM(CASE WHEN transfer_type = 'mint' THEN value ELSE 0 END) -
     SUM(CASE WHEN transfer_type = 'burn' THEN value ELSE 0 END)) / 1e18 AS net_change
FROM transfers tr
JOIN tokens t ON tr.token_id = t.id
GROUP BY DATE(block_timestamp), t.symbol
ORDER BY date DESC, t.symbol;
```

### Sync status

```sql
SELECT
    t.symbol,
    c.name AS chain,
    ss.last_block,
    ss.updated_at
FROM sync_state ss
JOIN tokens t ON ss.token_id = t.id
JOIN chains c ON ss.chain_id = c.id
ORDER BY t.symbol, c.name;
```

---

## Analytics Schema

The `analytics` schema contains tables for P2P classification and network analysis.

### Schema Overview

```
analytics schema
├── addresses              # Address enrichment cache (is_contract status)
├── address_labels         # Exclusion list (DEX pools, routers, bridges)
├── transfer_facts         # P2P tier classification per transfer
├── metrics_daily          # Daily aggregate metrics
├── edges_weekly           # Weekly P2P edges for graph analysis
├── network_weekly         # Computed graph KPIs
├── analytics_state        # Job checkpointing
├── cluster_runs           # Clustering algorithm parameters
├── stable_clusters        # Persistent cluster identities
├── cluster_instances_weekly  # Community snapshots per week
├── cluster_members_weekly    # Node-to-cluster assignments
└── cluster_transitions_weekly # Cluster evolution tracking
```

### analytics.addresses

Cache of address metadata discovered from transfers and trades.

| Column | Type | Description |
|--------|------|-------------|
| chain_id | INTEGER | FK to chains.id |
| address | VARCHAR(42) | Ethereum address |
| is_contract | BOOLEAN | True if address has code (NULL if unchecked) |
| first_seen_at | TIMESTAMP | First transfer/trade timestamp |
| last_seen_at | TIMESTAMP | Most recent activity |
| code_checked_at | TIMESTAMP | When eth_getCode was called |

**Primary key**: (chain_id, address)

### analytics.address_labels

Known addresses to exclude from P2P classification and/or clustering.

| Column | Type | Description |
|--------|------|-------------|
| chain_id | INTEGER | FK to chains.id |
| address | VARCHAR(42) | Ethereum address |
| category | VARCHAR(32) | dex_pool, dex_router, bridge, treasury, token_contract, cex, protocol, other |
| label | TEXT | Human-readable label |
| exclude_from_p2p | BOOLEAN | Whether to exclude from P2P tier classification (default: true) |
| exclude_from_clustering | BOOLEAN | Whether to exclude from community clustering (default: false) |
| source | VARCHAR(32) | manual, auto_pool, auto_router, auto_token |

**Unique constraint**: (chain_id, address, category)

### analytics.transfer_facts

P2P classification for each transfer.

| Column | Type | Description |
|--------|------|-------------|
| chain_id | INTEGER | FK to chains.id |
| tx_hash | VARCHAR(66) | Transaction hash |
| log_index | INTEGER | Log index |
| token_id | INTEGER | FK to tokens.id |
| from_is_contract | BOOLEAN | Sender is contract |
| to_is_contract | BOOLEAN | Recipient is contract |
| from_excluded | BOOLEAN | Sender in exclusion list |
| to_excluded | BOOLEAN | Recipient in exclusion list |
| p2p_tier | SMALLINT | 0=non-P2P, 1=EOA→EOA, 2=includes SCW, 3=broad, -1=unknown |
| p2p_reason_code | VARCHAR(32) | mint, burn, excluded, eoa_eoa, includes_scw, broad, unknown_code |

**Primary key**: (chain_id, tx_hash, log_index)
**Foreign key**: References transfers table with CASCADE delete

### analytics.metrics_daily

Daily aggregate metrics for dashboard.

| Column | Type | Description |
|--------|------|-------------|
| day | DATE | Date |
| chain_id | INTEGER | FK to chains.id |
| token_id | INTEGER | FK to tokens.id |
| minted_count | BIGINT | Number of mints |
| burned_count | BIGINT | Number of burns |
| minted_volume | NUMERIC | Total minted (wei) |
| burned_volume | NUMERIC | Total burned (wei) |
| net_issuance | NUMERIC | Minted - burned |
| transfer_count | BIGINT | Number of transfers |
| p2p_t1_count | BIGINT | Tier 1 transfer count |
| p2p_t1_volume | NUMERIC | Tier 1 volume |
| p2p_t1_active_users | BIGINT | Tier 1 unique addresses |
| p2p_t2_count | BIGINT | Tier 2 transfer count |
| p2p_t2_volume | NUMERIC | Tier 2 volume |
| p2p_t2_active_users | BIGINT | Tier 2 unique addresses |
| dex_trade_count | BIGINT | DEX swap count |
| dex_unique_traders | BIGINT | Unique DEX traders |

**Primary key**: (day, chain_id, token_id)

### analytics.edges_weekly

Aggregated P2P transfer edges by week for network analysis.

| Column | Type | Description |
|--------|------|-------------|
| week_start | DATE | Monday of ISO week |
| chain_id | INTEGER | FK to chains.id |
| token_id | INTEGER | FK to tokens.id |
| p2p_tier | SMALLINT | 1, 2, or 3 |
| from_address | VARCHAR(42) | Sender |
| to_address | VARCHAR(42) | Recipient |
| tx_count | BIGINT | Number of transfers |
| volume | NUMERIC | Total volume (wei) |

**Primary key**: (week_start, chain_id, token_id, p2p_tier, from_address, to_address)

### analytics.network_weekly

Computed graph KPIs from weekly edge data.

| Column | Type | Description |
|--------|------|-------------|
| week_start | DATE | Monday of ISO week |
| chain_id | INTEGER | FK to chains.id |
| token_id | INTEGER | FK to tokens.id |
| p2p_tier | SMALLINT | 1, 2, or 3 |
| nodes | BIGINT | Unique addresses |
| edges | BIGINT | Unique transfer pairs |
| new_nodes | BIGINT | First-time addresses this week |
| new_edges | BIGINT | First-time pairs this week |
| reciprocity_rate | NUMERIC | Fraction with reverse edge |
| repeat_pair_share | NUMERIC | Fraction of edges seen before |
| lcc_nodes | BIGINT | Largest connected component size |
| lcc_fraction | NUMERIC | LCC / total nodes |
| avg_degree | NUMERIC | Average connections per node |
| clustering_coefficient | NUMERIC | Network clustering |

**Primary key**: (week_start, chain_id, token_id, p2p_tier)

### analytics.analytics_state

Job checkpointing for incremental processing.

| Column | Type | Description |
|--------|------|-------------|
| job_name | VARCHAR(64) | Job identifier |
| chain_id | INTEGER | FK to chains.id |
| token_id | INTEGER | 0 for chain-level jobs, otherwise FK to tokens.id |
| last_block | BIGINT | Last processed block |
| last_timestamp | TIMESTAMP | Last processed timestamp |

**Primary key**: (job_name, chain_id, token_id)

**Note**: `token_id = 0` is used as a sentinel for chain-level jobs (e.g., address_enrichment) since NULL is not allowed in primary keys.

## Analytics Queries

### P2P transfer breakdown by tier

```sql
SELECT
    t.symbol,
    c.name AS chain,
    tf.p2p_tier,
    tf.p2p_reason_code,
    COUNT(*) AS transfers,
    SUM(tf.value) / 1e18 AS volume
FROM analytics.transfer_facts tf
JOIN tokens t ON tf.token_id = t.id
JOIN chains c ON tf.chain_id = c.id
GROUP BY t.symbol, c.name, tf.p2p_tier, tf.p2p_reason_code
ORDER BY t.symbol, c.name, tf.p2p_tier;
```

### Weekly network growth

```sql
SELECT
    n.week_start,
    t.symbol,
    c.name AS chain,
    n.p2p_tier,
    n.nodes,
    n.new_nodes,
    n.edges,
    n.new_edges,
    ROUND(n.reciprocity_rate * 100, 1) AS reciprocity_pct,
    ROUND(n.lcc_fraction * 100, 1) AS lcc_pct
FROM analytics.network_weekly n
JOIN tokens t ON n.token_id = t.id
JOIN chains c ON n.chain_id = c.id
ORDER BY n.week_start DESC, t.symbol, n.p2p_tier;
```

### Daily P2P metrics

```sql
SELECT
    m.day,
    t.symbol,
    c.name AS chain,
    m.p2p_t1_count AS tier1_txs,
    m.p2p_t1_active_users AS tier1_users,
    m.p2p_t1_volume / 1e18 AS tier1_volume,
    m.p2p_t2_count AS tier2_txs,
    m.p2p_t2_active_users AS tier2_users
FROM analytics.metrics_daily m
JOIN tokens t ON m.token_id = t.id
JOIN chains c ON m.chain_id = c.id
WHERE m.day >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY m.day DESC, t.symbol;
```

### Top P2P transfer pairs

```sql
SELECT
    e.from_address,
    e.to_address,
    e.tx_count,
    e.volume / 1e18 AS volume
FROM analytics.edges_weekly e
JOIN tokens t ON e.token_id = t.id
WHERE t.symbol = 'wARS'
  AND e.p2p_tier = 1
  AND e.week_start = (SELECT MAX(week_start) FROM analytics.edges_weekly)
ORDER BY e.volume DESC
LIMIT 20;
```

### Excluded addresses by category

```sql
SELECT
    c.name AS chain,
    al.category,
    COUNT(*) AS count,
    al.source
FROM analytics.address_labels al
JOIN chains c ON al.chain_id = c.id
WHERE al.exclude_from_p2p = TRUE
GROUP BY c.name, al.category, al.source
ORDER BY c.name, count DESC;
```

---

## Clustering Schema

The clustering tables store community detection results using the Louvain algorithm, with stable cluster IDs that track communities across weeks.

For detailed frontend integration patterns and query examples, see [CLUSTERING.md](./CLUSTERING.md).

### Schema Overview

```
analytics schema (clustering tables)
├── cluster_runs              # Algorithm parameters for reproducibility
├── stable_clusters           # Persistent cluster identities across weeks
├── cluster_instances_weekly  # Community snapshots with metrics per week
├── cluster_members_weekly    # Node-to-cluster assignments
└── cluster_transitions_weekly # Week-over-week evolution (splits/merges)
```

### analytics.cluster_runs

Algorithm parameters for each clustering run (for reproducibility).

| Column | Type | Description |
|--------|------|-------------|
| run_id | BIGSERIAL | Primary key |
| created_at | TIMESTAMP | When the run was executed |
| algorithm | VARCHAR(32) | Algorithm name (default: 'louvain') |
| algo_version | VARCHAR(32) | Library version (e.g., 'networkx-3.2') |
| weight_metric | VARCHAR(16) | Edge weight: 'volume' or 'tx_count' |
| p2p_tier | SMALLINT | 1, 2, or 3 |
| resolution | NUMERIC | Louvain resolution parameter |
| random_seed | INTEGER | Seed for reproducibility |
| min_jaccard | NUMERIC | Threshold for cluster matching |
| min_intersection | INTEGER | Min nodes for cluster matching |

### analytics.stable_clusters

Persistent cluster identities that track communities across time.

| Column | Type | Description |
|--------|------|-------------|
| stable_cluster_id | BIGSERIAL | Primary key - use this to track clusters |
| token_id | INTEGER | FK to tokens.id |
| chain_id | INTEGER | FK to chains.id |
| p2p_tier | SMALLINT | 1, 2, or 3 |
| created_week_start | DATE | Week when this cluster first appeared |
| created_at | TIMESTAMP | Creation timestamp |

### analytics.cluster_instances_weekly

Community snapshots for each week with aggregate metrics.

| Column | Type | Description |
|--------|------|-------------|
| week_start | DATE | Monday of ISO week |
| token_id | INTEGER | FK to tokens.id |
| chain_id | INTEGER | FK to chains.id |
| p2p_tier | SMALLINT | 1, 2, or 3 |
| run_id | BIGINT | FK to cluster_runs |
| community_label | INTEGER | Raw Louvain label (changes each run) |
| stable_cluster_id | BIGINT | FK to stable_clusters - **use this for tracking** |
| node_count | BIGINT | Number of addresses |
| edge_count | BIGINT | Number of edges within community |
| total_weight | NUMERIC | Total edge weight |
| internal_weight | NUMERIC | Weight of edges within community |
| external_weight | NUMERIC | Weight of edges to other communities |
| top_node_address | VARCHAR(42) | Highest-degree address |
| top_node_weight | NUMERIC | Weight of top node |

**Primary key**: (week_start, token_id, chain_id, p2p_tier, run_id, community_label)

### analytics.cluster_members_weekly

Node-to-cluster assignments with node metrics.

| Column | Type | Description |
|--------|------|-------------|
| week_start | DATE | Monday of ISO week |
| token_id | INTEGER | FK to tokens.id |
| chain_id | INTEGER | FK to chains.id |
| p2p_tier | SMALLINT | 1, 2, or 3 |
| run_id | BIGINT | FK to cluster_runs |
| address | VARCHAR(42) | Ethereum address (lowercase) |
| community_label | INTEGER | Raw Louvain label |
| stable_cluster_id | BIGINT | FK to stable_clusters |
| degree | BIGINT | Number of edges |
| in_weight | NUMERIC | Sum of incoming edge weights |
| out_weight | NUMERIC | Sum of outgoing edge weights |
| total_weight | NUMERIC | in_weight + out_weight |

**Primary key**: (week_start, token_id, chain_id, p2p_tier, run_id, address)

### analytics.cluster_transitions_weekly

Tracks how communities evolve between consecutive weeks.

| Column | Type | Description |
|--------|------|-------------|
| prev_week_start | DATE | Previous week |
| week_start | DATE | Current week |
| token_id | INTEGER | FK to tokens.id |
| chain_id | INTEGER | FK to chains.id |
| p2p_tier | SMALLINT | 1, 2, or 3 |
| prev_stable_cluster_id | BIGINT | Parent cluster from previous week |
| stable_cluster_id | BIGINT | Child cluster in current week |
| intersection_nodes | BIGINT | Number of shared addresses |
| jaccard | NUMERIC | Jaccard similarity: \|A ∩ B\| / \|A ∪ B\| |
| overlap_prev | NUMERIC | Fraction of prev cluster |
| overlap_new | NUMERIC | Fraction of new cluster |
| is_primary | BOOLEAN | TRUE if this is the best match |

**Primary key**: (prev_week_start, week_start, token_id, chain_id, p2p_tier, prev_stable_cluster_id, stable_cluster_id)

## Clustering Queries

### Communities for a specific week

```sql
SELECT
    ci.stable_cluster_id,
    ci.node_count,
    ci.edge_count,
    ci.total_weight / 1e18 AS total_volume,
    ci.top_node_address
FROM analytics.cluster_instances_weekly ci
JOIN tokens t ON ci.token_id = t.id
JOIN chains c ON ci.chain_id = c.id
WHERE t.symbol = 'wARS'
  AND c.name = 'worldchain'
  AND ci.p2p_tier = 2
  AND ci.week_start = '2024-12-16'
ORDER BY ci.node_count DESC;
```

### Cluster size over time

```sql
SELECT
    week_start,
    node_count,
    edge_count,
    total_weight / 1e18 AS volume
FROM analytics.cluster_instances_weekly
WHERE stable_cluster_id = 42
ORDER BY week_start;
```

### Detect community splits

```sql
SELECT
    prev_stable_cluster_id AS parent,
    week_start,
    COUNT(*) AS child_count,
    ARRAY_AGG(stable_cluster_id) AS children
FROM analytics.cluster_transitions_weekly
WHERE token_id = 1 AND chain_id = 3 AND p2p_tier = 2
GROUP BY prev_stable_cluster_id, week_start
HAVING COUNT(*) > 1
ORDER BY week_start DESC;
```

### Find cluster for an address

```sql
SELECT
    cm.week_start,
    cm.stable_cluster_id,
    ci.node_count AS cluster_size,
    cm.total_weight / 1e18 AS address_volume
FROM analytics.cluster_members_weekly cm
JOIN analytics.cluster_instances_weekly ci
    ON ci.week_start = cm.week_start
   AND ci.stable_cluster_id = cm.stable_cluster_id
   AND ci.token_id = cm.token_id
   AND ci.chain_id = cm.chain_id
   AND ci.p2p_tier = cm.p2p_tier
   AND ci.run_id = cm.run_id
WHERE cm.address = '0x1234...'
ORDER BY cm.week_start DESC;
```
