// Raw database row types (snake_case, matches DB schema)

export interface TokenRow {
  id: number;
  symbol: string;
  name: string;
  address: string;
  decimals: number;
}

export interface ChainRow {
  id: number;
  name: string;
  chain_id: number;
  rpc_url_env: string;
}

export interface MetricsDailyRow {
  day: string;
  chain_id: number;
  token_id: number;
  minted_count: string;
  burned_count: string;
  minted_volume: string;
  burned_volume: string;
  net_issuance: string;
  transfer_count: string;
  p2p_t1_count: string;
  p2p_t1_volume: string;
  p2p_t1_active_users: string;
  p2p_t2_count: string;
  p2p_t2_volume: string;
  p2p_t2_active_users: string;
  dex_trade_count: string;
  dex_unique_traders: string;
}

export interface NetworkWeeklyRow {
  week_start: string;
  chain_id: number;
  token_id: number;
  p2p_tier: number;
  nodes: string;
  edges: string;
  new_nodes: string;
  new_edges: string;
  reciprocity_rate: string;
  repeat_pair_share: string;
  lcc_nodes: string;
  lcc_fraction: string;
  avg_degree: string;
  clustering_coefficient: string;
}

export interface EdgesWeeklyRow {
  week_start: string;
  chain_id: number;
  token_id: number;
  p2p_tier: number;
  from_address: string;
  to_address: string;
  tx_count: string;
  volume: string;
}

export interface TradeRow {
  id: string;
  chain_id: number;
  token_id: number;
  tx_hash: string;
  log_index: number;
  block_number: string;
  block_timestamp: string;
  dex_name: string;
  pool_address: string;
  trader_address: string;
  token_in_address: string;
  token_out_address: string;
  amount_in: string;
  amount_out: string;
  is_buy: boolean;
}

export interface SyncStateRow {
  id: number;
  chain_id: number;
  token_id: number;
  last_block: string;
  updated_at: string;
}
