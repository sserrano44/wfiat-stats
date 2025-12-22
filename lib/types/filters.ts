export type TokenSymbol =
  | "wARS"
  | "wBRL"
  | "wMXN"
  | "wCOP"
  | "wPEN"
  | "wCLP"
  | "all";

export type ChainName = "ethereum" | "base" | "worldchain" | "all";

export type TimeRange = "7d" | "30d" | "90d" | "180d" | "365d" | "custom";

export type P2PTier = 1 | 2 | 3 | "all";

export interface FilterState {
  token: TokenSymbol;
  chain: ChainName;
  range: TimeRange;
  startDate?: string; // ISO date string for custom range
  endDate?: string;
  p2pTier: P2PTier;
}

// Internal filter params for database queries
export interface FilterParams {
  tokenId?: number;
  chainId?: number;
  startDate?: Date;
  endDate?: Date;
  p2pTier?: number;
}

// Lookup maps for symbol/name to ID conversion
export interface TokenLookup {
  id: number;
  symbol: string;
  name: string;
  decimals: number;
}

export interface ChainLookup {
  id: number;
  name: string;
  evmChainId: number;
}
