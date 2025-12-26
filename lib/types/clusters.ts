// Cluster types for community detection data

export interface ClusterSummary {
  stableClusterId: number;
  nodeCount: number;
  edgeCount: number;
  totalWeight: number;
  internalWeight: number;
  externalWeight: number;
  topNodeAddress: string;
  topNodeWeight: number;
  createdWeekStart: string;
}

export interface ClusterMember {
  address: string;
  degree: number;
  inWeight: number;
  outWeight: number;
  totalWeight: number;
  label?: string;
  category?: string;
}

export interface ClusterHistoryPoint {
  weekStart: string;
  nodeCount: number;
  edgeCount: number;
  totalWeight: number;
}

export interface ClusterTransition {
  prevWeekStart: string;
  weekStart: string;
  prevStableClusterId: number;
  stableClusterId: number;
  intersectionNodes: number;
  jaccard: number;
  overlapPrev: number;
  overlapNew: number;
  isPrimary: boolean;
}

export interface ClustersSummary {
  weekStart: string;
  totalClusters: number;
  totalNodes: number;
  avgClusterSize: number;
  largestClusterSize: number;
}

export interface ClustersResponse {
  summary: ClustersSummary;
  clusters: ClusterSummary[];
  generatedAt: string;
}

export interface ClusterDetailResponse {
  cluster: ClusterSummary;
  members: ClusterMember[];
  history: ClusterHistoryPoint[];
  transitions: ClusterTransition[];
  generatedAt: string;
}
