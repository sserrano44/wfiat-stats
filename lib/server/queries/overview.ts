import "server-only";
import { query, scaleValue } from "../db";
import { resolveTokenId, resolveChainId } from "./filters";
import type { ValidatedFilters } from "@/lib/validation/filters";
import type { OverviewMetrics, OverviewTimeSeriesPoint } from "@/lib/types/api";

interface RawAggregateRow {
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

interface RawTimeSeriesRow {
  day: string;
  minted_volume: string;
  burned_volume: string;
  net_issuance: string;
  p2p_t1_volume: string;
  p2p_t1_active_users: string;
  p2p_t2_volume: string;
  p2p_t2_active_users: string;
  dex_trade_count: string;
}

/**
 * Get aggregated overview metrics for the period
 *
 * SQL (single token + single chain):
 * SELECT
 *   COALESCE(SUM(minted_count), 0) as minted_count,
 *   COALESCE(SUM(burned_count), 0) as burned_count,
 *   COALESCE(SUM(minted_volume), 0)::text as minted_volume,
 *   ...
 * FROM analytics.metrics_daily
 * WHERE token_id = $1 AND chain_id = $2 AND day BETWEEN $3 AND $4;
 */
export async function getOverviewMetrics(
  filters: ValidatedFilters
): Promise<OverviewMetrics> {
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
      COALESCE(SUM(minted_count), 0)::text as minted_count,
      COALESCE(SUM(burned_count), 0)::text as burned_count,
      COALESCE(SUM(minted_volume), 0)::text as minted_volume,
      COALESCE(SUM(burned_volume), 0)::text as burned_volume,
      COALESCE(SUM(net_issuance), 0)::text as net_issuance,
      COALESCE(SUM(transfer_count), 0)::text as transfer_count,
      COALESCE(SUM(p2p_t1_count), 0)::text as p2p_t1_count,
      COALESCE(SUM(p2p_t1_volume), 0)::text as p2p_t1_volume,
      COALESCE(SUM(p2p_t1_active_users), 0)::text as p2p_t1_active_users,
      COALESCE(SUM(p2p_t2_count), 0)::text as p2p_t2_count,
      COALESCE(SUM(p2p_t2_volume), 0)::text as p2p_t2_volume,
      COALESCE(SUM(p2p_t2_active_users), 0)::text as p2p_t2_active_users,
      COALESCE(SUM(dex_trade_count), 0)::text as dex_trade_count,
      COALESCE(SUM(dex_unique_traders), 0)::text as dex_unique_traders
    FROM analytics.metrics_daily
    ${whereClause}
  `;

  const rows = await query<RawAggregateRow>(sql, params);
  const row = rows[0];

  return {
    mintedCount: parseInt(row.minted_count, 10) || 0,
    burnedCount: parseInt(row.burned_count, 10) || 0,
    mintedVolume: scaleValue(row.minted_volume),
    burnedVolume: scaleValue(row.burned_volume),
    netIssuance: scaleValue(row.net_issuance),
    transferCount: parseInt(row.transfer_count, 10) || 0,
    p2pT1Count: parseInt(row.p2p_t1_count, 10) || 0,
    p2pT1Volume: scaleValue(row.p2p_t1_volume),
    p2pT1ActiveUsers: parseInt(row.p2p_t1_active_users, 10) || 0,
    p2pT2Count: parseInt(row.p2p_t2_count, 10) || 0,
    p2pT2Volume: scaleValue(row.p2p_t2_volume),
    p2pT2ActiveUsers: parseInt(row.p2p_t2_active_users, 10) || 0,
    dexTradeCount: parseInt(row.dex_trade_count, 10) || 0,
    dexUniqueTraders: parseInt(row.dex_unique_traders, 10) || 0,
  };
}

/**
 * Get daily time series for overview charts
 *
 * SQL (with aggregation for "all tokens" or "all chains"):
 * SELECT
 *   day,
 *   SUM(minted_volume)::text as minted_volume,
 *   SUM(burned_volume)::text as burned_volume,
 *   ...
 * FROM analytics.metrics_daily
 * WHERE ...
 * GROUP BY day
 * ORDER BY day ASC;
 */
export async function getOverviewTimeSeries(
  filters: ValidatedFilters
): Promise<OverviewTimeSeriesPoint[]> {
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
      SUM(minted_volume)::text as minted_volume,
      SUM(burned_volume)::text as burned_volume,
      SUM(net_issuance)::text as net_issuance,
      SUM(p2p_t1_volume)::text as p2p_t1_volume,
      SUM(p2p_t1_active_users)::text as p2p_t1_active_users,
      SUM(p2p_t2_volume)::text as p2p_t2_volume,
      SUM(p2p_t2_active_users)::text as p2p_t2_active_users,
      SUM(dex_trade_count)::text as dex_trade_count
    FROM analytics.metrics_daily
    ${whereClause}
    GROUP BY day
    ORDER BY day ASC
  `;

  const rows = await query<RawTimeSeriesRow>(sql, params);

  return rows.map((row) => ({
    day: row.day,
    mintedVolume: scaleValue(row.minted_volume),
    burnedVolume: scaleValue(row.burned_volume),
    netIssuance: scaleValue(row.net_issuance),
    p2pT1Volume: scaleValue(row.p2p_t1_volume),
    p2pT1ActiveUsers: parseInt(row.p2p_t1_active_users, 10) || 0,
    p2pT2Volume: scaleValue(row.p2p_t2_volume),
    p2pT2ActiveUsers: parseInt(row.p2p_t2_active_users, 10) || 0,
    dexTradeCount: parseInt(row.dex_trade_count, 10) || 0,
  }));
}
