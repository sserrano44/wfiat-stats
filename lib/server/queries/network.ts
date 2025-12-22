import "server-only";
import { query, scaleValue } from "../db";
import { resolveTokenId, resolveChainId } from "./filters";
import type { ValidatedFilters } from "@/lib/validation/filters";
import type { NetworkMetricsPoint, P2PPair } from "@/lib/types/api";

interface RawNetworkRow {
  week_start: string;
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

interface RawEdgeRow {
  from_address: string;
  to_address: string;
  tx_count: string;
  volume: string;
}

/**
 * Get weekly network KPIs
 *
 * SQL:
 * SELECT
 *   week_start, p2p_tier,
 *   SUM(nodes) as nodes, SUM(edges) as edges,
 *   SUM(new_nodes) as new_nodes, SUM(new_edges) as new_edges,
 *   AVG(reciprocity_rate) as reciprocity_rate,
 *   AVG(repeat_pair_share) as repeat_pair_share,
 *   SUM(lcc_nodes) as lcc_nodes,
 *   AVG(lcc_fraction) as lcc_fraction,
 *   AVG(avg_degree) as avg_degree,
 *   AVG(clustering_coefficient) as clustering_coefficient
 * FROM analytics.network_weekly
 * WHERE token_id = $1 AND chain_id = $2 AND p2p_tier = $3
 *   AND week_start BETWEEN $4 AND $5
 * GROUP BY week_start, p2p_tier
 * ORDER BY week_start ASC, p2p_tier ASC;
 */
export async function getNetworkTimeSeries(
  filters: ValidatedFilters
): Promise<NetworkMetricsPoint[]> {
  const tokenId = await resolveTokenId(filters.token);
  const chainId = await resolveChainId(filters.chain);

  const conditions: string[] = [];
  const params: (string | number | Date)[] = [];
  let paramIndex = 1;

  if (tokenId !== undefined) {
    conditions.push(`token_id = $${paramIndex++}`);
    params.push(tokenId);
  }
  if (chainId !== undefined) {
    conditions.push(`chain_id = $${paramIndex++}`);
    params.push(chainId);
  }
  if (filters.p2pTier !== undefined) {
    conditions.push(`p2p_tier = $${paramIndex++}`);
    params.push(filters.p2pTier);
  }
  if (filters.startDate) {
    conditions.push(`week_start >= $${paramIndex++}`);
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    conditions.push(`week_start <= $${paramIndex++}`);
    params.push(filters.endDate);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    SELECT
      week_start::text as week_start,
      p2p_tier,
      SUM(nodes)::text as nodes,
      SUM(edges)::text as edges,
      SUM(new_nodes)::text as new_nodes,
      SUM(new_edges)::text as new_edges,
      AVG(reciprocity_rate)::text as reciprocity_rate,
      AVG(repeat_pair_share)::text as repeat_pair_share,
      SUM(lcc_nodes)::text as lcc_nodes,
      AVG(lcc_fraction)::text as lcc_fraction,
      AVG(avg_degree)::text as avg_degree,
      AVG(clustering_coefficient)::text as clustering_coefficient
    FROM analytics.network_weekly
    ${whereClause}
    GROUP BY week_start, p2p_tier
    ORDER BY week_start ASC, p2p_tier ASC
  `;

  const rows = await query<RawNetworkRow>(sql, params);

  return rows.map((row) => ({
    weekStart: row.week_start,
    p2pTier: row.p2p_tier,
    nodes: parseInt(row.nodes, 10) || 0,
    edges: parseInt(row.edges, 10) || 0,
    newNodes: parseInt(row.new_nodes, 10) || 0,
    newEdges: parseInt(row.new_edges, 10) || 0,
    reciprocityRate: parseFloat(row.reciprocity_rate) || 0,
    repeatPairShare: parseFloat(row.repeat_pair_share) || 0,
    lccNodes: parseInt(row.lcc_nodes, 10) || 0,
    lccFraction: parseFloat(row.lcc_fraction) || 0,
    avgDegree: parseFloat(row.avg_degree) || 0,
    clusteringCoefficient: parseFloat(row.clustering_coefficient) || 0,
  }));
}

/**
 * Get top P2P corridors for a specific week
 *
 * SQL (top by volume):
 * SELECT from_address, to_address, tx_count, volume::text
 * FROM analytics.edges_weekly
 * WHERE token_id = $1 AND chain_id = $2 AND p2p_tier = $3 AND week_start = $4
 * ORDER BY volume DESC
 * LIMIT 50;
 */
export async function getTopCorridors(
  filters: ValidatedFilters,
  weekStart: Date,
  orderBy: "volume" | "tx_count" = "volume",
  limit: number = 50
): Promise<P2PPair[]> {
  const tokenId = await resolveTokenId(filters.token);
  const chainId = await resolveChainId(filters.chain);

  const conditions: string[] = ["week_start = $1"];
  const params: (string | number | Date)[] = [weekStart];
  let paramIndex = 2;

  if (tokenId !== undefined) {
    conditions.push(`token_id = $${paramIndex++}`);
    params.push(tokenId);
  }
  if (chainId !== undefined) {
    conditions.push(`chain_id = $${paramIndex++}`);
    params.push(chainId);
  }
  if (filters.p2pTier !== undefined) {
    conditions.push(`p2p_tier = $${paramIndex++}`);
    params.push(filters.p2pTier);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;
  const orderColumn = orderBy === "volume" ? "volume" : "tx_count";

  const sql = `
    SELECT
      from_address,
      to_address,
      tx_count::text as tx_count,
      volume::text as volume
    FROM analytics.edges_weekly
    ${whereClause}
    ORDER BY ${orderColumn} DESC
    LIMIT $${paramIndex}
  `;

  params.push(limit);

  const rows = await query<RawEdgeRow>(sql, params);

  return rows.map((row) => ({
    fromAddress: row.from_address,
    toAddress: row.to_address,
    txCount: parseInt(row.tx_count, 10) || 0,
    volume: scaleValue(row.volume),
  }));
}

/**
 * Get available weeks for network data (for week selector)
 */
export async function getAvailableWeeks(
  filters: ValidatedFilters
): Promise<string[]> {
  const tokenId = await resolveTokenId(filters.token);
  const chainId = await resolveChainId(filters.chain);

  const conditions: string[] = [];
  const params: (string | number | Date)[] = [];
  let paramIndex = 1;

  if (tokenId !== undefined) {
    conditions.push(`token_id = $${paramIndex++}`);
    params.push(tokenId);
  }
  if (chainId !== undefined) {
    conditions.push(`chain_id = $${paramIndex++}`);
    params.push(chainId);
  }
  if (filters.startDate) {
    conditions.push(`week_start >= $${paramIndex++}`);
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    conditions.push(`week_start <= $${paramIndex++}`);
    params.push(filters.endDate);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    SELECT DISTINCT week_start::text as week_start
    FROM analytics.network_weekly
    ${whereClause}
    ORDER BY week_start DESC
  `;

  const rows = await query<{ week_start: string }>(sql, params);
  return rows.map((r) => r.week_start);
}
