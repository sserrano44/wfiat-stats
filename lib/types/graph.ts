// Graph API types

export interface GraphNode {
  id: string;              // Ethereum address
  label: string;           // Truncated address for display
  degree: number;          // Total number of edges (in + out)
  inDegree: number;
  outDegree: number;
  totalVolume: number;     // Sum of all edge volumes (scaled)
  totalTxCount: number;    // Sum of all edge tx counts
}

export interface GraphEdge {
  id: string;              // `${source}-${target}`
  source: string;          // from_address
  target: string;          // to_address
  txCount: number;
  volume: number;          // Scaled volume
  weight: number;          // For layout computation
}

export interface GraphMeta {
  weekStart: string;
  token: string;
  chain: string;
  tier: number | null;
  totalNodes: number;      // Before any limiting
  totalEdges: number;
  maxVolume: number;       // For normalization
  maxTxCount: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  meta: GraphMeta;
}

export interface GraphResponse extends GraphData {
  generatedAt: string;
}

// Client-side state types

export type WeightMetric = "volume" | "txCount";
export type ScaleType = "linear" | "log";

export interface GraphControlState {
  metric: WeightMetric;
  scale: ScaleType;
  minEdgeWeight: number;   // Minimum edge weight filter
  maxNodes: number;        // Cap on nodes
  hideIsolated: boolean;
  layoutRunning: boolean;
}

export interface GraphInteractionState {
  selectedNode: string | null;
  hoveredNode: string | null;
  searchQuery: string;
  focusedCommunity: number | null;
}

// Graphology node attributes (after processing)
export interface GraphologyNodeAttributes {
  label: string;
  degree: number;
  inDegree: number;
  outDegree: number;
  totalVolume: number;
  totalTxCount: number;
  community: number;
  size: number;
  color: string;
  x: number;
  y: number;
}

// Graphology edge attributes
export interface GraphologyEdgeAttributes {
  weight: number;
  volume: number;
  txCount: number;
  size: number;
  color?: string;
}
