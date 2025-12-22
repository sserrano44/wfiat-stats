import "server-only";
import { query } from "../db";
import type { FreshnessItem } from "@/lib/types/api";

interface RawSyncRow {
  token_symbol: string;
  chain_name: string;
  last_block: string;
  updated_at: string;
}

/**
 * Get sync state for all token/chain combinations
 * Joins with tokens and chains tables for human-readable names
 */
export async function getSyncState(): Promise<FreshnessItem[]> {
  const sql = `
    SELECT
      t.symbol as token_symbol,
      c.name as chain_name,
      ss.last_block::text as last_block,
      ss.updated_at::text as updated_at
    FROM sync_state ss
    JOIN tokens t ON ss.token_id = t.id
    JOIN chains c ON ss.chain_id = c.id
    ORDER BY t.symbol, c.name
  `;

  const rows = await query<RawSyncRow>(sql);
  const now = Date.now();

  return rows.map((row) => {
    const updatedAt = new Date(row.updated_at);
    const ageMinutes = Math.floor((now - updatedAt.getTime()) / 60000);

    return {
      tokenSymbol: row.token_symbol,
      chainName: row.chain_name,
      lastBlock: parseInt(row.last_block, 10),
      updatedAt: updatedAt.toISOString(),
      ageMinutes,
    };
  });
}
