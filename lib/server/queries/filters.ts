import "server-only";
import { query } from "../db";
import type { TokenRow, ChainRow } from "@/lib/types/database";
import type { TokenLookup, ChainLookup } from "@/lib/types/filters";

// Cache for token/chain lookups (refreshed on server restart)
let tokenCache: TokenLookup[] | null = null;
let chainCache: ChainLookup[] | null = null;

/**
 * Get all tokens from database
 * SELECT id, symbol, name, decimals FROM tokens ORDER BY symbol;
 */
export async function getTokens(): Promise<TokenLookup[]> {
  if (tokenCache) return tokenCache;

  const rows = await query<TokenRow>(
    "SELECT id, symbol, name, decimals FROM tokens ORDER BY symbol"
  );

  tokenCache = rows.map((row) => ({
    id: row.id,
    symbol: row.symbol,
    name: row.name,
    decimals: row.decimals,
  }));

  return tokenCache;
}

/**
 * Get all chains from database
 * SELECT id, name, evm_chain_id FROM chains ORDER BY id;
 */
export async function getChains(): Promise<ChainLookup[]> {
  if (chainCache) return chainCache;

  const rows = await query<ChainRow>(
    "SELECT id, name, chain_id FROM chains ORDER BY id"
  );

  chainCache = rows.map((row) => ({
    id: row.id,
    name: row.name,
    evmChainId: row.chain_id,
  }));

  return chainCache;
}

/**
 * Resolve token symbol to database ID
 */
export async function resolveTokenId(
  symbol: string | "all"
): Promise<number | undefined> {
  if (symbol === "all") return undefined;

  const tokens = await getTokens();
  const token = tokens.find(
    (t) => t.symbol.toLowerCase() === symbol.toLowerCase()
  );
  return token?.id;
}

/**
 * Resolve chain name to database ID
 */
export async function resolveChainId(
  name: string | "all"
): Promise<number | undefined> {
  if (name === "all") return undefined;

  const chains = await getChains();
  const chain = chains.find((c) => c.name.toLowerCase() === name.toLowerCase());
  return chain?.id;
}

/**
 * Get token decimals for value scaling
 */
export async function getTokenDecimals(tokenId: number): Promise<number> {
  const tokens = await getTokens();
  const token = tokens.find((t) => t.id === tokenId);
  return token?.decimals ?? 18;
}

/**
 * Clear caches (for testing or forced refresh)
 */
export function clearFilterCaches(): void {
  tokenCache = null;
  chainCache = null;
}
