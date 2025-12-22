import "server-only";
import { query, scaleValue } from "../db";
import { resolveTokenId, resolveChainId } from "./filters";
import type { ValidatedFilters } from "@/lib/validation/filters";
import type { DexMetricsPoint } from "@/lib/types/api";

interface RawDexMetricsRow {
  day: string;
  dex_trade_count: string;
  dex_unique_traders: string;
  p2p_t1_count: string;
  p2p_t1_volume: string;
}

interface RawDexVolumeRow {
  day: string;
  wfiat_volume: string;
}

/**
 * Get daily DEX metrics from analytics.metrics_daily
 *
 * SQL:
 * SELECT
 *   day,
 *   SUM(dex_trade_count) as dex_trade_count,
 *   SUM(dex_unique_traders) as dex_unique_traders,
 *   SUM(p2p_t1_count) as p2p_t1_count,
 *   SUM(p2p_t1_volume) as p2p_t1_volume
 * FROM analytics.metrics_daily
 * WHERE token_id = $1 AND chain_id = $2 AND day BETWEEN $3 AND $4
 * GROUP BY day
 * ORDER BY day ASC;
 */
export async function getDexMetricsFromDaily(
  filters: ValidatedFilters
): Promise<
  Array<{
    day: string;
    tradeCount: number;
    uniqueTraders: number;
    p2pT1Count: number;
    p2pT1Volume: number;
  }>
> {
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
      SUM(dex_trade_count)::text as dex_trade_count,
      SUM(dex_unique_traders)::text as dex_unique_traders,
      SUM(p2p_t1_count)::text as p2p_t1_count,
      SUM(p2p_t1_volume)::text as p2p_t1_volume
    FROM analytics.metrics_daily
    ${whereClause}
    GROUP BY day
    ORDER BY day ASC
  `;

  const rows = await query<RawDexMetricsRow>(sql, params);

  return rows.map((row) => ({
    day: row.day,
    tradeCount: parseInt(row.dex_trade_count, 10) || 0,
    uniqueTraders: parseInt(row.dex_unique_traders, 10) || 0,
    p2pT1Count: parseInt(row.p2p_t1_count, 10) || 0,
    p2pT1Volume: scaleValue(row.p2p_t1_volume),
  }));
}

/**
 * Get DEX wFiat volume from raw trades table
 * (Used when dex_wfiat_volume is not available in metrics_daily)
 *
 * SQL:
 * SELECT
 *   DATE(block_timestamp) as day,
 *   SUM(CASE WHEN is_buy THEN amount_out ELSE amount_in END)::text as wfiat_volume
 * FROM trades
 * WHERE token_id = $1 AND chain_id = $2
 *   AND block_timestamp BETWEEN $3 AND $4
 * GROUP BY DATE(block_timestamp)
 * ORDER BY day ASC;
 */
export async function getDexVolumeFromTrades(
  filters: ValidatedFilters
): Promise<Map<string, number>> {
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
    conditions.push(`block_timestamp >= $${paramIndex++}`);
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    conditions.push(`block_timestamp <= $${paramIndex++}`);
    params.push(filters.endDate);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    SELECT
      DATE(block_timestamp)::text as day,
      SUM(CASE WHEN is_buy THEN amount_out ELSE amount_in END)::text as wfiat_volume
    FROM trades
    ${whereClause}
    GROUP BY DATE(block_timestamp)
    ORDER BY day ASC
  `;

  const rows = await query<RawDexVolumeRow>(sql, params);

  const volumeMap = new Map<string, number>();
  for (const row of rows) {
    volumeMap.set(row.day, scaleValue(row.wfiat_volume));
  }
  return volumeMap;
}

/**
 * Get combined DEX metrics with wFiat volume derived from trades
 */
export async function getDexTimeSeries(
  filters: ValidatedFilters
): Promise<DexMetricsPoint[]> {
  // Get metrics from analytics.metrics_daily
  const dailyMetrics = await getDexMetricsFromDaily(filters);

  // Get wFiat volume from trades table
  const volumeMap = await getDexVolumeFromTrades(filters);

  return dailyMetrics.map((row) => {
    const wfiatVolume = volumeMap.get(row.day) || 0;

    return {
      day: row.day,
      tradeCount: row.tradeCount,
      uniqueTraders: row.uniqueTraders,
      wfiatVolume,
      // Transfer-to-trade ratios
      p2pToTradeCountRatio:
        row.tradeCount > 0 ? row.p2pT1Count / row.tradeCount : undefined,
      p2pToTradeVolumeRatio:
        wfiatVolume > 0 ? row.p2pT1Volume / wfiatVolume : undefined,
    };
  });
}

/**
 * Get DEX aggregates for the period
 */
export async function getDexAggregates(filters: ValidatedFilters): Promise<{
  totalTradeCount: number;
  totalUniqueTraders: number;
  totalWfiatVolume: number;
}> {
  const timeSeries = await getDexTimeSeries(filters);

  return {
    totalTradeCount: timeSeries.reduce((sum, p) => sum + p.tradeCount, 0),
    totalUniqueTraders: timeSeries.reduce(
      (max, p) => Math.max(max, p.uniqueTraders),
      0
    ), // Note: this is max, not sum, for unique
    totalWfiatVolume: timeSeries.reduce((sum, p) => sum + p.wfiatVolume, 0),
  };
}
