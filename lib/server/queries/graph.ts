import "server-only";
import { query, scaleValue } from "../db";
import { resolveTokenId, resolveChainId } from "./filters";
import { getNodeClusterAssignments } from "./clusters";
import type { GraphParams } from "@/lib/validation/graph";
import type { GraphData, GraphNode, GraphEdge } from "@/lib/types/graph";

interface RawEdgeRow {
  from_address: string;
  to_address: string;
  tx_count: string;
  volume: string;
}

interface NodeData {
  inDegree: number;
  outDegree: number;
  inVolume: number;
  outVolume: number;
  inTxCount: number;
  outTxCount: number;
}

/**
 * Get graph data for visualization from analytics.edges_weekly
 * Returns nodes (addresses) and edges (transfers) for a specific week
 */
export async function getGraphData(params: GraphParams): Promise<GraphData> {
  const tokenId = await resolveTokenId(params.token);
  const chainId = await resolveChainId(params.chain);

  // Build WHERE clause
  // Use string for date comparison to avoid timezone issues
  const conditions: string[] = ["week_start = $1::date"];
  const sqlParams: (string | number)[] = [params.weekStart];
  let paramIdx = 2;

  if (tokenId !== undefined) {
    conditions.push(`token_id = $${paramIdx++}`);
    sqlParams.push(tokenId);
  }
  if (chainId !== undefined) {
    conditions.push(`chain_id = $${paramIdx++}`);
    sqlParams.push(chainId);
  }
  if (params.tier !== undefined && params.tier !== null) {
    conditions.push(`p2p_tier = $${paramIdx++}`);
    sqlParams.push(params.tier);
  }

  // Query all edges for the week (limit at edge level for safety)
  const sql = `
    SELECT
      from_address,
      to_address,
      tx_count::text as tx_count,
      volume::text as volume
    FROM analytics.edges_weekly
    WHERE ${conditions.join(" AND ")}
    ORDER BY volume DESC
    LIMIT 10000
  `;

  const rows = await query<RawEdgeRow>(sql, sqlParams);

  // Build node map from edges
  const nodeMap = new Map<string, NodeData>();
  const edges: GraphEdge[] = [];
  let maxVolume = 0;
  let maxTxCount = 0;
  const totalEdges = rows.length;

  const initNode = (): NodeData => ({
    inDegree: 0,
    outDegree: 0,
    inVolume: 0,
    outVolume: 0,
    inTxCount: 0,
    outTxCount: 0,
  });

  for (const row of rows) {
    const volume = scaleValue(row.volume);
    const txCount = parseInt(row.tx_count, 10) || 0;

    // Update max values
    maxVolume = Math.max(maxVolume, volume);
    maxTxCount = Math.max(maxTxCount, txCount);

    // Apply min edge filter based on metric
    const edgeValue = params.metric === "volume" ? volume : txCount;
    if (edgeValue < params.minEdge) continue;

    // Normalize addresses to lowercase for consistent matching
    const fromAddr = row.from_address.toLowerCase();
    const toAddr = row.to_address.toLowerCase();

    // Initialize nodes if needed
    if (!nodeMap.has(fromAddr)) nodeMap.set(fromAddr, initNode());
    if (!nodeMap.has(toAddr)) nodeMap.set(toAddr, initNode());

    const fromNode = nodeMap.get(fromAddr)!;
    const toNode = nodeMap.get(toAddr)!;

    // Update from_address (outgoing)
    fromNode.outDegree++;
    fromNode.outVolume += volume;
    fromNode.outTxCount += txCount;

    // Update to_address (incoming)
    toNode.inDegree++;
    toNode.inVolume += volume;
    toNode.inTxCount += txCount;

    // Compute weight for layout (log scale for better visualization)
    const weight =
      params.metric === "volume"
        ? Math.log10(1 + volume)
        : Math.log10(1 + txCount);

    edges.push({
      id: `${fromAddr}-${toAddr}`,
      source: fromAddr,
      target: toAddr,
      txCount,
      volume,
      weight,
    });
  }

  const totalNodes = nodeMap.size;

  // Sort nodes by metric and apply max_nodes limit
  const sortedNodes = Array.from(nodeMap.entries())
    .map(([address, data]) => ({
      address,
      totalVolume: data.inVolume + data.outVolume,
      totalTxCount: data.inTxCount + data.outTxCount,
      ...data,
    }))
    .sort((a, b) => {
      const metricA = params.metric === "volume" ? a.totalVolume : a.totalTxCount;
      const metricB = params.metric === "volume" ? b.totalVolume : b.totalTxCount;
      return metricB - metricA;
    })
    .slice(0, params.maxNodes);

  const allowedAddresses = new Set(sortedNodes.map((n) => n.address));

  // Filter edges to only include allowed nodes
  const filteredEdges = edges.filter(
    (e) => allowedAddresses.has(e.source) && allowedAddresses.has(e.target)
  );

  // Fetch cluster assignments from backend
  let clusterAssignments: Map<string, number> = new Map();
  try {
    clusterAssignments = await getNodeClusterAssignments({
      token: params.token,
      chain: params.chain,
      weekStart: params.weekStart,
      p2pTier: params.tier ?? 2,
    });
  } catch (e) {
    // Clustering data may not be available, continue without it
    console.warn("Could not load cluster assignments:", e);
  }

  // Build final node list with truncated labels and cluster IDs
  const nodes: GraphNode[] = sortedNodes.map((n) => ({
    id: n.address,
    label: `${n.address.slice(0, 6)}...${n.address.slice(-4)}`,
    degree: n.inDegree + n.outDegree,
    inDegree: n.inDegree,
    outDegree: n.outDegree,
    totalVolume: n.totalVolume,
    totalTxCount: n.totalTxCount,
    stableClusterId: clusterAssignments.get(n.address.toLowerCase()) ?? null,
  }));

  return {
    nodes,
    edges: filteredEdges,
    meta: {
      weekStart: params.weekStart,
      token: params.token,
      chain: params.chain,
      tier: params.tier ?? null,
      totalNodes,
      totalEdges,
      maxVolume,
      maxTxCount,
    },
  };
}

/**
 * Get available weeks for graph visualization
 */
export async function getAvailableWeeks(
  token: string,
  chain: string,
  tier?: number | null
): Promise<string[]> {
  const tokenId = await resolveTokenId(token);
  const chainId = await resolveChainId(chain);

  const conditions: string[] = [];
  const sqlParams: (number)[] = [];
  let paramIdx = 1;

  if (tokenId !== undefined) {
    conditions.push(`token_id = $${paramIdx++}`);
    sqlParams.push(tokenId);
  }
  if (chainId !== undefined) {
    conditions.push(`chain_id = $${paramIdx++}`);
    sqlParams.push(chainId);
  }
  if (tier !== undefined && tier !== null) {
    conditions.push(`p2p_tier = $${paramIdx++}`);
    sqlParams.push(tier);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    SELECT DISTINCT week_start::text as week_start
    FROM analytics.edges_weekly
    ${whereClause}
    ORDER BY week_start DESC
    LIMIT 52
  `;

  const rows = await query<{ week_start: string }>(sql, sqlParams);
  return rows.map((r) => r.week_start.split("T")[0]);
}
