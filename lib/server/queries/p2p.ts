import "server-only";
import { query, scaleValue } from "../db";
import { resolveTokenId, resolveChainId } from "./filters";
import type { ValidatedFilters } from "@/lib/validation/filters";
import type { P2PMetricsPoint, P2PPair } from "@/lib/types/api";

interface RawP2PRow {
  day: string;
  t1_count: string;
  t1_volume: string;
  t1_active_users: string;
  t2_count: string;
  t2_volume: string;
  t2_active_users: string;
  transfer_count: string;
}

interface RawEdgeRow {
  from_address: string;
  to_address: string;
  tx_count: string;
  volume: string;
}

/**
 * Get daily P2P metrics time series
 *
 * SQL:
 * SELECT
 *   day,
 *   SUM(p2p_t1_count) as t1_count,
 *   SUM(p2p_t1_volume)::text as t1_volume,
 *   SUM(p2p_t1_active_users) as t1_active_users,
 *   SUM(p2p_t2_count) as t2_count,
 *   SUM(p2p_t2_volume)::text as t2_volume,
 *   SUM(p2p_t2_active_users) as t2_active_users,
 *   SUM(transfer_count) as transfer_count
 * FROM analytics.metrics_daily
 * WHERE token_id = $1 AND chain_id = $2 AND day BETWEEN $3 AND $4
 * GROUP BY day
 * ORDER BY day ASC;
 */
export async function getP2PTimeSeries(
  filters: ValidatedFilters
): Promise<P2PMetricsPoint[]> {
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
    conditions.push(`day >= $${paramIndex++}`);
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    conditions.push(`day <= $${paramIndex++}`);
    params.push(filters.endDate);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    SELECT
      day::text as day,
      SUM(p2p_t1_count)::text as t1_count,
      SUM(p2p_t1_volume)::text as t1_volume,
      SUM(p2p_t1_active_users)::text as t1_active_users,
      SUM(p2p_t2_count)::text as t2_count,
      SUM(p2p_t2_volume)::text as t2_volume,
      SUM(p2p_t2_active_users)::text as t2_active_users,
      SUM(transfer_count)::text as transfer_count
    FROM analytics.metrics_daily
    ${whereClause}
    GROUP BY day
    ORDER BY day ASC
  `;

  const rows = await query<RawP2PRow>(sql, params);

  return rows.map((row) => {
    const t1Count = parseInt(row.t1_count, 10) || 0;
    const t2Count = parseInt(row.t2_count, 10) || 0;
    const transferCount = parseInt(row.transfer_count, 10) || 0;
    const t1Volume = scaleValue(row.t1_volume);
    const t2Volume = scaleValue(row.t2_volume);
    // Derive transfer_volume as sum of all volumes (p2p + mint + burn, but we only have p2p here)
    // Using transferCount ratio is more accurate for share calculation
    const totalVolume = t1Volume + t2Volume;

    return {
      day: row.day,
      t1Count,
      t1Volume,
      t1ActiveUsers: parseInt(row.t1_active_users, 10) || 0,
      t2Count,
      t2Volume,
      t2ActiveUsers: parseInt(row.t2_active_users, 10) || 0,
      transferCount,
      // P2P share metrics
      t1CountShare: transferCount > 0 ? t1Count / transferCount : 0,
      t1VolumeShare: totalVolume > 0 ? t1Volume / totalVolume : 0,
      t2CountShare: transferCount > 0 ? t2Count / transferCount : 0,
      t2VolumeShare: totalVolume > 0 ? t2Volume / totalVolume : 0,
    };
  });
}

/**
 * Get top P2P pairs by volume for the selected period
 *
 * SQL:
 * SELECT
 *   from_address, to_address,
 *   SUM(tx_count) as tx_count,
 *   SUM(volume)::text as volume
 * FROM analytics.edges_weekly
 * WHERE token_id = $1 AND chain_id = $2 AND p2p_tier = $3
 *   AND week_start BETWEEN $4 AND $5
 * GROUP BY from_address, to_address
 * ORDER BY SUM(volume) DESC
 * LIMIT 50;
 */
export async function getTopP2PPairs(
  filters: ValidatedFilters,
  limit: number = 50
): Promise<P2PPair[]> {
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
      from_address,
      to_address,
      SUM(tx_count)::text as tx_count,
      SUM(volume)::text as volume
    FROM analytics.edges_weekly
    ${whereClause}
    GROUP BY from_address, to_address
    ORDER BY SUM(volume) DESC
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
