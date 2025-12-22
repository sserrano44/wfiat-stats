// Table of contents items
export const tocItems = [
  { id: "overview", label: "Overview" },
  { id: "terminology", label: "Terminology" },
  { id: "data-model", label: "Data Model" },
  { id: "interpretation", label: "Interpretation Guide" },
  { id: "freshness", label: "Data Freshness" },
  { id: "examples", label: "Example Queries" },
];

// Glossary items
export const glossaryItems = [
  {
    term: "Transfer Event",
    definition:
      "ERC-20 Transfer event emitted when tokens move between addresses. Every mint, burn, and transfer produces one of these events.",
  },
  {
    term: "Mint",
    definition:
      "Transfer from the zero address (0x0000...0000). Indicates new tokens entering circulation, typically from an on-ramp operation.",
  },
  {
    term: "Burn",
    definition:
      "Transfer to the zero address. Indicates tokens leaving circulation, typically from an off-ramp operation.",
  },
  {
    term: "Zero Address",
    definition:
      "0x0000000000000000000000000000000000000000 - Used to identify mints (from=zero) and burns (to=zero).",
  },
  {
    term: "Trade / Swap",
    definition:
      "Token exchange on a DEX, detected by analyzing Swap events from liquidity pool contracts.",
  },
  {
    term: "DEX",
    definition:
      "Decentralized Exchange - protocols like Uniswap, Aerodrome that enable token swaps without intermediaries.",
  },
  {
    term: "pool_address",
    definition: "The liquidity pool contract address where a swap occurred.",
  },
  {
    term: "trader_address",
    definition:
      "The address that initiated the swap transaction (the user or router).",
  },
  {
    term: "is_buy",
    definition:
      "Boolean flag: true if the swap acquired wFiat tokens (bought), false if it sold wFiat tokens.",
  },
  {
    term: "EOA (Externally Owned Account)",
    definition:
      "Regular wallet controlled by a private key. Has no contract code deployed.",
  },
  {
    term: "Contract",
    definition:
      "Smart contract address with deployed bytecode. Detected via eth_getCode RPC call.",
  },
  {
    term: "SCW (Smart Contract Wallet)",
    definition:
      "User-controlled smart contract wallet like Safe, Argent, or account abstraction wallets. Behaves like an EOA but is technically a contract.",
  },
  {
    term: "P2P Tier 1",
    definition:
      "Strictest P2P definition: EOA-to-EOA transfers only. Both sender and receiver are externally owned accounts.",
  },
  {
    term: "P2P Tier 2",
    definition:
      "Includes smart contract wallets. At least one side may be an SCW, but excludes known DEX/bridge contracts.",
  },
  {
    term: "P2P Tier 3",
    definition:
      "Broadest definition including more contract types. May include some protocol interactions.",
  },
  {
    term: "Node (Network)",
    definition: "A unique address in the P2P transfer graph.",
  },
  {
    term: "Edge (Network)",
    definition:
      "A directed transfer relationship between two addresses (A→B). Weighted by transaction count and volume.",
  },
  {
    term: "LCC (Largest Connected Component)",
    definition:
      "The biggest subgraph where all nodes are reachable from each other. A higher LCC fraction indicates a more cohesive network.",
  },
  {
    term: "Reciprocity Rate",
    definition:
      "Fraction of edges that have a reverse edge (if A→B exists, does B→A also exist?). Higher reciprocity suggests bidirectional relationships.",
  },
  {
    term: "Repeat-pair Share",
    definition:
      "Fraction of address pairs that transacted in previous periods. Indicates relationship persistence over time.",
  },
  {
    term: "Active User / Active Address",
    definition:
      "Address that sent or received tokens in the selected time period. Note: addresses are not people—one user may control multiple addresses.",
  },
  {
    term: "Wei",
    definition:
      "Smallest unit of tokens (10^-18 of a token). Database stores values in wei; divide by 10^18 for human-readable amounts.",
  },
  {
    term: "Decimals",
    definition:
      "Number of decimal places for the token. All wFiat tokens use 18 decimals (standard ERC-20).",
  },
];

// Core tables schema
export const coreTablesSchemas = [
  {
    tableName: "tokens",
    description: "Registry of tracked wFiat stablecoins",
    columns: [
      { name: "id", type: "SERIAL", description: "Primary key" },
      {
        name: "symbol",
        type: "VARCHAR(10)",
        description: "Token symbol (wARS, wBRL, etc.)",
      },
      { name: "name", type: "VARCHAR(50)", description: "Full token name" },
      { name: "address", type: "VARCHAR(42)", description: "Contract address" },
      {
        name: "decimals",
        type: "INTEGER",
        description: "Token decimals (always 18)",
      },
    ],
  },
  {
    tableName: "chains",
    description: "Registry of supported blockchains",
    columns: [
      {
        name: "id",
        type: "SERIAL",
        description: "Primary key (used as FK in other tables)",
      },
      { name: "name", type: "VARCHAR(20)", description: "Chain name" },
      {
        name: "chain_id",
        type: "INTEGER",
        description: "EVM chain ID (1, 8453, 480)",
      },
      {
        name: "rpc_url_env",
        type: "VARCHAR(50)",
        description: "Env var name for RPC URL",
      },
    ],
  },
  {
    tableName: "transfers",
    description:
      "All ERC-20 Transfer events indexed from blockchain. Unique on (chain_id, tx_hash, log_index).",
    columns: [
      { name: "id", type: "BIGSERIAL", description: "Primary key" },
      { name: "chain_id", type: "INTEGER", description: "FK to chains.id" },
      { name: "token_id", type: "INTEGER", description: "FK to tokens.id" },
      { name: "tx_hash", type: "VARCHAR(66)", description: "Transaction hash" },
      {
        name: "log_index",
        type: "INTEGER",
        description: "Event log index within transaction",
      },
      { name: "block_number", type: "BIGINT", description: "Block number" },
      {
        name: "block_timestamp",
        type: "TIMESTAMP",
        description: "Block time (UTC)",
      },
      { name: "from_address", type: "VARCHAR(42)", description: "Sender" },
      { name: "to_address", type: "VARCHAR(42)", description: "Recipient" },
      {
        name: "value",
        type: "NUMERIC(78,0)",
        description: "Amount in wei (divide by 10^18)",
      },
      {
        name: "transfer_type",
        type: "VARCHAR(10)",
        description: "'mint', 'burn', or 'transfer'",
      },
    ],
  },
  {
    tableName: "trades",
    description:
      "DEX swap events involving wFiat tokens. Detected from Uniswap/Aerodrome pools.",
    columns: [
      { name: "id", type: "BIGSERIAL", description: "Primary key" },
      { name: "chain_id", type: "INTEGER", description: "FK to chains.id" },
      { name: "token_id", type: "INTEGER", description: "FK to tokens.id" },
      { name: "tx_hash", type: "VARCHAR(66)", description: "Transaction hash" },
      { name: "dex_name", type: "VARCHAR(50)", description: "DEX name" },
      {
        name: "pool_address",
        type: "VARCHAR(42)",
        description: "Liquidity pool contract",
      },
      {
        name: "trader_address",
        type: "VARCHAR(42)",
        description: "Swap initiator",
      },
      {
        name: "is_buy",
        type: "BOOLEAN",
        description: "True if buying wFiat, false if selling",
      },
      {
        name: "amount_in",
        type: "NUMERIC(78,0)",
        description: "Input amount (wei)",
      },
      {
        name: "amount_out",
        type: "NUMERIC(78,0)",
        description: "Output amount (wei)",
      },
    ],
  },
  {
    tableName: "sync_state",
    description:
      "Tracks synchronization progress per token/chain combination. Used to resume indexing.",
    columns: [
      { name: "id", type: "SERIAL", description: "Primary key" },
      { name: "chain_id", type: "INTEGER", description: "FK to chains.id" },
      { name: "token_id", type: "INTEGER", description: "FK to tokens.id" },
      {
        name: "last_block",
        type: "BIGINT",
        description: "Last synced block number",
      },
      {
        name: "updated_at",
        type: "TIMESTAMP",
        description: "Last sync timestamp",
      },
    ],
  },
];

// Analytics tables schema
export const analyticsTablesSchemas = [
  {
    tableName: "analytics.metrics_daily",
    description:
      "Daily aggregate metrics powering dashboard charts. Primary key: (day, chain_id, token_id).",
    columns: [
      { name: "day", type: "DATE", description: "Calendar date" },
      { name: "chain_id", type: "INTEGER", description: "FK to chains.id" },
      { name: "token_id", type: "INTEGER", description: "FK to tokens.id" },
      {
        name: "minted_count",
        type: "BIGINT",
        description: "Number of mint events",
      },
      {
        name: "burned_count",
        type: "BIGINT",
        description: "Number of burn events",
      },
      {
        name: "minted_volume",
        type: "NUMERIC",
        description: "Total minted (wei)",
      },
      {
        name: "burned_volume",
        type: "NUMERIC",
        description: "Total burned (wei)",
      },
      {
        name: "net_issuance",
        type: "NUMERIC",
        description: "minted_volume - burned_volume",
      },
      {
        name: "p2p_t1_count",
        type: "BIGINT",
        description: "Tier 1 P2P transfer count",
      },
      {
        name: "p2p_t1_active_users",
        type: "BIGINT",
        description: "Tier 1 unique addresses",
      },
      {
        name: "dex_trade_count",
        type: "BIGINT",
        description: "DEX swap count",
      },
    ],
  },
  {
    tableName: "analytics.network_weekly",
    description:
      "Weekly graph KPIs computed from P2P transfer edges. Primary key: (week_start, chain_id, token_id, p2p_tier).",
    columns: [
      {
        name: "week_start",
        type: "DATE",
        description: "Monday of ISO week (YYYY-MM-DD)",
      },
      { name: "chain_id", type: "INTEGER", description: "FK to chains.id" },
      { name: "token_id", type: "INTEGER", description: "FK to tokens.id" },
      { name: "p2p_tier", type: "SMALLINT", description: "1, 2, or 3" },
      {
        name: "nodes",
        type: "BIGINT",
        description: "Cumulative unique addresses",
      },
      { name: "edges", type: "BIGINT", description: "Cumulative unique pairs" },
      {
        name: "new_nodes",
        type: "BIGINT",
        description: "First-time addresses this week",
      },
      {
        name: "new_edges",
        type: "BIGINT",
        description: "New pairs this week",
      },
      {
        name: "reciprocity_rate",
        type: "NUMERIC",
        description: "Fraction with bidirectional edges",
      },
      {
        name: "repeat_pair_share",
        type: "NUMERIC",
        description: "Fraction of recurring pairs",
      },
      {
        name: "lcc_nodes",
        type: "BIGINT",
        description: "Nodes in largest connected component",
      },
      {
        name: "lcc_fraction",
        type: "NUMERIC",
        description: "lcc_nodes / nodes",
      },
      {
        name: "avg_degree",
        type: "NUMERIC",
        description: "Average connections per node",
      },
    ],
  },
  {
    tableName: "analytics.edges_weekly",
    description:
      "Weekly aggregated P2P transfer edges for network visualization. Primary key: (week_start, chain_id, token_id, p2p_tier, from_address, to_address).",
    columns: [
      { name: "week_start", type: "DATE", description: "Monday of ISO week" },
      { name: "chain_id", type: "INTEGER", description: "FK to chains.id" },
      { name: "token_id", type: "INTEGER", description: "FK to tokens.id" },
      { name: "p2p_tier", type: "SMALLINT", description: "1, 2, or 3" },
      { name: "from_address", type: "VARCHAR(42)", description: "Sender" },
      { name: "to_address", type: "VARCHAR(42)", description: "Recipient" },
      {
        name: "tx_count",
        type: "BIGINT",
        description: "Number of transfers in the week",
      },
      {
        name: "volume",
        type: "NUMERIC",
        description: "Total volume in wei",
      },
    ],
  },
];

// Example SQL queries
export const exampleQueries = [
  {
    title: "Transfer Statistics by Token",
    description:
      "Aggregate transfer counts and volumes grouped by token and chain.",
    sql: `SELECT
  t.symbol,
  c.name AS chain,
  COUNT(*) FILTER (WHERE tr.transfer_type = 'transfer') AS transfers,
  COUNT(*) FILTER (WHERE tr.transfer_type = 'mint') AS mints,
  COUNT(*) FILTER (WHERE tr.transfer_type = 'burn') AS burns,
  SUM(tr.value) FILTER (WHERE tr.transfer_type = 'mint') / 1e18 AS minted_volume
FROM transfers tr
JOIN tokens t ON tr.token_id = t.id
JOIN chains c ON tr.chain_id = c.id
GROUP BY t.symbol, c.name
ORDER BY t.symbol, c.name;`,
  },
  {
    title: "Daily P2P Metrics (Last 7 Days)",
    description: "P2P transfer activity from the analytics.metrics_daily table.",
    sql: `SELECT
  m.day,
  t.symbol,
  m.p2p_t1_count AS tier1_txs,
  m.p2p_t1_active_users AS tier1_users,
  m.p2p_t1_volume / 1e18 AS tier1_volume
FROM analytics.metrics_daily m
JOIN tokens t ON m.token_id = t.id
WHERE m.day >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY m.day DESC, t.symbol;`,
  },
  {
    title: "Sync Status",
    description: "Check current synchronization progress for all token/chain pairs.",
    sql: `SELECT
  t.symbol,
  c.name AS chain,
  ss.last_block,
  ss.updated_at,
  NOW() - ss.updated_at AS age
FROM sync_state ss
JOIN tokens t ON ss.token_id = t.id
JOIN chains c ON ss.chain_id = c.id
ORDER BY t.symbol, c.name;`,
  },
  {
    title: "Top P2P Corridors (Weekly)",
    description: "Most active address pairs by transfer volume for a given week.",
    sql: `SELECT
  from_address,
  to_address,
  tx_count,
  volume / 1e18 AS volume_tokens
FROM analytics.edges_weekly
WHERE week_start = '2024-01-01'  -- Replace with desired week
  AND p2p_tier = 1
ORDER BY volume DESC
LIMIT 20;`,
  },
  {
    title: "Network Growth Over Time",
    description: "Weekly network metrics showing node and edge growth.",
    sql: `SELECT
  week_start,
  nodes,
  edges,
  new_nodes,
  new_edges,
  ROUND(reciprocity_rate * 100, 1) AS reciprocity_pct,
  ROUND(lcc_fraction * 100, 1) AS lcc_pct
FROM analytics.network_weekly
WHERE token_id = 1  -- Replace with desired token
  AND chain_id = 1  -- Replace with desired chain
  AND p2p_tier = 1
ORDER BY week_start;`,
  },
];
