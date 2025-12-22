// API response types (camelCase, scaled numbers)

export interface OverviewMetrics {
  mintedCount: number;
  burnedCount: number;
  mintedVolume: number;
  burnedVolume: number;
  netIssuance: number;
  transferCount: number;
  p2pT1Count: number;
  p2pT1Volume: number;
  p2pT1ActiveUsers: number;
  p2pT2Count: number;
  p2pT2Volume: number;
  p2pT2ActiveUsers: number;
  dexTradeCount: number;
  dexUniqueTraders: number;
}

export interface OverviewTimeSeriesPoint {
  day: string;
  mintedVolume: number;
  burnedVolume: number;
  netIssuance: number;
  p2pT1Volume: number;
  p2pT1ActiveUsers: number;
  p2pT2Volume: number;
  p2pT2ActiveUsers: number;
  dexTradeCount: number;
}

export interface OverviewResponse {
  metrics: OverviewMetrics;
  timeSeries: OverviewTimeSeriesPoint[];
  generatedAt: string;
}

export interface P2PMetricsPoint {
  day: string;
  t1Count: number;
  t1Volume: number;
  t1ActiveUsers: number;
  t2Count: number;
  t2Volume: number;
  t2ActiveUsers: number;
  transferCount: number;
  // Derived ratios
  t1CountShare: number;
  t1VolumeShare: number;
  t2CountShare: number;
  t2VolumeShare: number;
}

export interface P2PPair {
  fromAddress: string;
  toAddress: string;
  txCount: number;
  volume: number;
}

export interface P2PResponse {
  timeSeries: P2PMetricsPoint[];
  topPairs: P2PPair[];
  generatedAt: string;
}

export interface NetworkMetricsPoint {
  weekStart: string;
  p2pTier: number;
  nodes: number;
  edges: number;
  newNodes: number;
  newEdges: number;
  reciprocityRate: number;
  repeatPairShare: number;
  lccNodes: number;
  lccFraction: number;
  avgDegree: number;
  clusteringCoefficient: number;
}

export interface NetworkResponse {
  timeSeries: NetworkMetricsPoint[];
  topCorridors: P2PPair[];
  generatedAt: string;
}

export interface DexMetricsPoint {
  day: string;
  tradeCount: number;
  uniqueTraders: number;
  wfiatVolume: number;
  // Derived: transfer-to-trade ratio
  p2pToTradeCountRatio?: number;
  p2pToTradeVolumeRatio?: number;
}

export interface DexResponse {
  timeSeries: DexMetricsPoint[];
  aggregates: {
    totalTradeCount: number;
    totalUniqueTraders: number;
    totalWfiatVolume: number;
  };
  generatedAt: string;
}

export interface FiltersResponse {
  tokens: Array<{ id: number; symbol: string; name: string; decimals: number }>;
  chains: Array<{ id: number; name: string; evmChainId: number }>;
}

// Freshness / Sync state
export interface FreshnessItem {
  tokenSymbol: string;
  chainName: string;
  lastBlock: number;
  updatedAt: string;
  ageMinutes: number;
}

export interface FreshnessResponse {
  items: FreshnessItem[];
  generatedAt: string;
}

// Error response
export interface ApiError {
  error: string;
  details?: unknown;
  fallback?: boolean;
  message?: string;
}
