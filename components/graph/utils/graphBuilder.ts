import Graph from "graphology";
import type { GraphData, WeightMetric, ScaleType } from "@/lib/types/graph";
import { getCommunityColor } from "./communityColors";

/**
 * Build a Graphology graph from API data
 */
export function buildGraph(data: GraphData): Graph {
  const graph = new Graph({ type: "directed", multi: false });

  // Add nodes with initial positions (pseudo-random based on address hash)
  for (const node of data.nodes) {
    // Generate deterministic initial position from address
    const hash = hashCode(node.id);
    const angle = (hash % 360) * (Math.PI / 180);
    const radius = 100 + (hash % 400);

    graph.addNode(node.id, {
      label: node.label,
      degree: node.degree,
      inDegree: node.inDegree,
      outDegree: node.outDegree,
      totalVolume: node.totalVolume,
      totalTxCount: node.totalTxCount,
      community: 0,
      size: 5,
      color: "#666666",
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  }

  // Add edges
  for (const edge of data.edges) {
    if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
      try {
        graph.addEdge(edge.source, edge.target, {
          weight: edge.weight,
          volume: edge.volume,
          txCount: edge.txCount,
          size: Math.max(0.5, Math.min(3, edge.weight / 2)),
          color: "#444444",
        });
      } catch {
        // Edge may already exist (multi=false)
      }
    }
  }

  return graph;
}

/**
 * Apply backend-computed cluster assignments and assign colors
 * Uses stableClusterId from the API response
 */
export function applyCommunities(graph: Graph, data: GraphData): Map<number, number> {
  if (graph.order === 0) return new Map();

  // Count nodes per community
  const communityStats = new Map<number, number>();

  // Apply community IDs and colors to nodes from backend data
  graph.forEachNode((nodeId) => {
    // Find the node in the data to get its stableClusterId
    const nodeData = data.nodes.find((n) => n.id === nodeId);
    const clusterId = nodeData?.stableClusterId ?? 0;
    const color = getCommunityColor(clusterId);

    graph.setNodeAttribute(nodeId, "community", clusterId);
    graph.setNodeAttribute(nodeId, "color", color);

    // Track community sizes
    communityStats.set(clusterId, (communityStats.get(clusterId) || 0) + 1);
  });

  // Update edge colors based on source node
  graph.forEachEdge((edgeId, _attrs, source) => {
    const sourceColor = graph.getNodeAttribute(source, "color") as string;
    graph.setEdgeAttribute(edgeId, "color", sourceColor + "66"); // Add transparency
  });

  return communityStats;
}

/**
 * Compute node sizes based on metric and scale
 */
export function computeNodeSizes(
  graph: Graph,
  metric: WeightMetric,
  scale: ScaleType
): void {
  if (graph.order === 0) return;

  const values: number[] = [];

  graph.forEachNode((_nodeId, attrs) => {
    const value = metric === "volume" ? attrs.totalVolume : attrs.totalTxCount;
    values.push(value);
  });

  const maxValue = Math.max(...values, 1);
  const minSize = 4;
  const maxSize = 25;

  graph.forEachNode((nodeId, attrs) => {
    const value = metric === "volume" ? attrs.totalVolume : attrs.totalTxCount;
    let normalized: number;

    if (scale === "log") {
      normalized = Math.log10(value + 1) / Math.log10(maxValue + 1);
    } else {
      normalized = value / maxValue;
    }

    const size = minSize + normalized * (maxSize - minSize);
    graph.setNodeAttribute(nodeId, "size", size);
  });
}

/**
 * Get neighbors of a node
 */
export function getNodeNeighbors(graph: Graph, nodeId: string): string[] {
  if (!graph.hasNode(nodeId)) return [];
  return graph.neighbors(nodeId);
}

/**
 * Get edges connected to a node
 */
export function getNodeEdges(
  graph: Graph,
  nodeId: string
): Array<{ id: string; source: string; target: string; weight: number }> {
  if (!graph.hasNode(nodeId)) return [];

  const edges: Array<{ id: string; source: string; target: string; weight: number }> = [];

  graph.forEachEdge(nodeId, (edgeId, attrs, source, target) => {
    edges.push({
      id: edgeId,
      source,
      target,
      weight: attrs.weight as number,
    });
  });

  return edges;
}

/**
 * Simple hash function for deterministic positioning
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}
