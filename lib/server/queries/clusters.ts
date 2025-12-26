import "server-only";
import { query, scaleValue } from "../db";
import { resolveTokenId, resolveChainId } from "./filters";
import type { ClusterParams, ClusterDetailParams } from "@/lib/validation/clusters";
import type {
  ClusterSummary,
  ClusterMember,
  ClusterHistoryPoint,
  ClusterTransition,
  ClustersSummary,
} from "@/lib/types/clusters";

// Raw database row types
interface RawClusterRow {
  stable_cluster_id: string;
  node_count: string;
  edge_count: string;
  total_weight: string;
  internal_weight: string;
  external_weight: string;
  top_node_address: string;
  top_node_weight: string;
  created_week_start: string;
}

interface RawClusterMemberRow {
  address: string;
  degree: string;
  in_weight: string;
  out_weight: string;
  total_weight: string;
  label: string | null;
  category: string | null;
}

interface RawClusterHistoryRow {
  week_start: string;
  node_count: string;
  edge_count: string;
  total_weight: string;
}

interface RawClusterTransitionRow {
  prev_week_start: string;
  week_start: string;
  prev_stable_cluster_id: string;
  stable_cluster_id: string;
  intersection_nodes: string;
  jaccard: string;
  overlap_prev: string;
  overlap_new: string;
  is_primary: boolean;
}

interface RawClusterSummaryRow {
  total_clusters: string;
  total_nodes: string;
  avg_cluster_size: string;
  largest_cluster_size: string;
}

interface RawNodeClusterRow {
  address: string;
  stable_cluster_id: string;
}

/**
 * Build WHERE clause conditions for cluster queries
 */
function buildClusterConditions(
  params: ClusterParams,
  tokenId: number | undefined,
  chainId: number | undefined,
  tableAlias: string = "ci"
): { conditions: string[]; sqlParams: (string | number)[]; nextParamIdx: number } {
  const conditions: string[] = [`${tableAlias}.week_start = $1::date`];
  const sqlParams: (string | number)[] = [params.weekStart];
  let nextParamIdx = 2;

  if (tokenId !== undefined) {
    conditions.push(`${tableAlias}.token_id = $${nextParamIdx++}`);
    sqlParams.push(tokenId);
  }
  if (chainId !== undefined) {
    conditions.push(`${tableAlias}.chain_id = $${nextParamIdx++}`);
    sqlParams.push(chainId);
  }
  if (params.p2pTier !== undefined && params.p2pTier !== null) {
    conditions.push(`${tableAlias}.p2p_tier = $${nextParamIdx++}`);
    sqlParams.push(params.p2pTier);
  }

  return { conditions, sqlParams, nextParamIdx };
}

/**
 * Get summary statistics for a week
 */
export async function getClustersSummary(
  params: ClusterParams
): Promise<ClustersSummary> {
  const tokenId = await resolveTokenId(params.token);
  const chainId = await resolveChainId(params.chain);

  const { conditions, sqlParams } = buildClusterConditions(params, tokenId, chainId);

  const sql = `
    SELECT
      COUNT(*)::text AS total_clusters,
      COALESCE(SUM(ci.node_count), 0)::text AS total_nodes,
      COALESCE(AVG(ci.node_count), 0)::text AS avg_cluster_size,
      COALESCE(MAX(ci.node_count), 0)::text AS largest_cluster_size
    FROM analytics.cluster_instances_weekly ci
    WHERE ${conditions.join(" AND ")}
  `;

  const rows = await query<RawClusterSummaryRow>(sql, sqlParams);

  if (rows.length === 0) {
    return {
      weekStart: params.weekStart,
      totalClusters: 0,
      totalNodes: 0,
      avgClusterSize: 0,
      largestClusterSize: 0,
    };
  }

  const row = rows[0];
  return {
    weekStart: params.weekStart,
    totalClusters: parseInt(row.total_clusters, 10),
    totalNodes: parseInt(row.total_nodes, 10),
    avgClusterSize: parseFloat(row.avg_cluster_size),
    largestClusterSize: parseInt(row.largest_cluster_size, 10),
  };
}

/**
 * Get all communities for a specific week
 */
export async function getClustersForWeek(
  params: ClusterParams
): Promise<ClusterSummary[]> {
  const tokenId = await resolveTokenId(params.token);
  const chainId = await resolveChainId(params.chain);

  const { conditions, sqlParams } = buildClusterConditions(params, tokenId, chainId);

  const sql = `
    SELECT
      ci.stable_cluster_id::text,
      ci.node_count::text,
      ci.edge_count::text,
      ci.total_weight::text,
      ci.internal_weight::text,
      ci.external_weight::text,
      ci.top_node_address,
      ci.top_node_weight::text,
      sc.created_week_start::text
    FROM analytics.cluster_instances_weekly ci
    JOIN analytics.stable_clusters sc ON sc.stable_cluster_id = ci.stable_cluster_id
    WHERE ${conditions.join(" AND ")}
    ORDER BY ci.node_count DESC
    LIMIT 200
  `;

  const rows = await query<RawClusterRow>(sql, sqlParams);

  return rows.map((row) => ({
    stableClusterId: parseInt(row.stable_cluster_id, 10),
    nodeCount: parseInt(row.node_count, 10),
    edgeCount: parseInt(row.edge_count, 10),
    totalWeight: scaleValue(row.total_weight),
    internalWeight: scaleValue(row.internal_weight),
    externalWeight: scaleValue(row.external_weight),
    topNodeAddress: row.top_node_address,
    topNodeWeight: scaleValue(row.top_node_weight),
    createdWeekStart: row.created_week_start.split("T")[0],
  }));
}

/**
 * Get single cluster details
 */
export async function getClusterById(
  params: ClusterDetailParams
): Promise<ClusterSummary | null> {
  const tokenId = await resolveTokenId(params.token);
  const chainId = await resolveChainId(params.chain);

  const { conditions, sqlParams, nextParamIdx } = buildClusterConditions(
    params,
    tokenId,
    chainId
  );
  conditions.push(`ci.stable_cluster_id = $${nextParamIdx}`);
  sqlParams.push(params.stableClusterId);

  const sql = `
    SELECT
      ci.stable_cluster_id::text,
      ci.node_count::text,
      ci.edge_count::text,
      ci.total_weight::text,
      ci.internal_weight::text,
      ci.external_weight::text,
      ci.top_node_address,
      ci.top_node_weight::text,
      sc.created_week_start::text
    FROM analytics.cluster_instances_weekly ci
    JOIN analytics.stable_clusters sc ON sc.stable_cluster_id = ci.stable_cluster_id
    WHERE ${conditions.join(" AND ")}
    LIMIT 1
  `;

  const rows = await query<RawClusterRow>(sql, sqlParams);

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    stableClusterId: parseInt(row.stable_cluster_id, 10),
    nodeCount: parseInt(row.node_count, 10),
    edgeCount: parseInt(row.edge_count, 10),
    totalWeight: scaleValue(row.total_weight),
    internalWeight: scaleValue(row.internal_weight),
    externalWeight: scaleValue(row.external_weight),
    topNodeAddress: row.top_node_address,
    topNodeWeight: scaleValue(row.top_node_weight),
    createdWeekStart: row.created_week_start.split("T")[0],
  };
}

/**
 * Get members of a specific cluster
 */
export async function getClusterMembers(
  params: ClusterDetailParams
): Promise<ClusterMember[]> {
  const tokenId = await resolveTokenId(params.token);
  const chainId = await resolveChainId(params.chain);

  const { conditions, sqlParams, nextParamIdx } = buildClusterConditions(
    params,
    tokenId,
    chainId,
    "cm"
  );
  conditions.push(`cm.stable_cluster_id = $${nextParamIdx}`);
  sqlParams.push(params.stableClusterId);

  const sql = `
    SELECT
      cm.address,
      cm.degree::text,
      cm.in_weight::text,
      cm.out_weight::text,
      cm.total_weight::text,
      al.label,
      al.category
    FROM analytics.cluster_members_weekly cm
    LEFT JOIN analytics.address_labels al
      ON al.chain_id = cm.chain_id AND al.address = cm.address
    WHERE ${conditions.join(" AND ")}
    ORDER BY cm.total_weight DESC
    LIMIT 500
  `;

  const rows = await query<RawClusterMemberRow>(sql, sqlParams);

  return rows.map((row) => ({
    address: row.address,
    degree: parseInt(row.degree, 10),
    inWeight: scaleValue(row.in_weight),
    outWeight: scaleValue(row.out_weight),
    totalWeight: scaleValue(row.total_weight),
    label: row.label ?? undefined,
    category: row.category ?? undefined,
  }));
}

/**
 * Get cluster size history over time
 */
export async function getClusterHistory(
  params: ClusterDetailParams
): Promise<ClusterHistoryPoint[]> {
  const tokenId = await resolveTokenId(params.token);
  const chainId = await resolveChainId(params.chain);

  const conditions: string[] = ["ci.stable_cluster_id = $1"];
  const sqlParams: (string | number)[] = [params.stableClusterId];
  let nextParamIdx = 2;

  if (tokenId !== undefined) {
    conditions.push(`ci.token_id = $${nextParamIdx++}`);
    sqlParams.push(tokenId);
  }
  if (chainId !== undefined) {
    conditions.push(`ci.chain_id = $${nextParamIdx++}`);
    sqlParams.push(chainId);
  }
  if (params.p2pTier !== undefined && params.p2pTier !== null) {
    conditions.push(`ci.p2p_tier = $${nextParamIdx++}`);
    sqlParams.push(params.p2pTier);
  }

  const sql = `
    SELECT
      ci.week_start::text,
      ci.node_count::text,
      ci.edge_count::text,
      ci.total_weight::text
    FROM analytics.cluster_instances_weekly ci
    WHERE ${conditions.join(" AND ")}
    ORDER BY ci.week_start ASC
  `;

  const rows = await query<RawClusterHistoryRow>(sql, sqlParams);

  return rows.map((row) => ({
    weekStart: row.week_start.split("T")[0],
    nodeCount: parseInt(row.node_count, 10),
    edgeCount: parseInt(row.edge_count, 10),
    totalWeight: scaleValue(row.total_weight),
  }));
}

/**
 * Get cluster transitions (splits/merges) for a cluster
 */
export async function getClusterTransitions(
  params: ClusterDetailParams
): Promise<ClusterTransition[]> {
  const tokenId = await resolveTokenId(params.token);
  const chainId = await resolveChainId(params.chain);

  // Get transitions where this cluster is either the source or target
  const conditions: string[] = [
    "(ct.stable_cluster_id = $1 OR ct.prev_stable_cluster_id = $1)",
  ];
  const sqlParams: (string | number)[] = [params.stableClusterId];
  let nextParamIdx = 2;

  if (tokenId !== undefined) {
    conditions.push(`ct.token_id = $${nextParamIdx++}`);
    sqlParams.push(tokenId);
  }
  if (chainId !== undefined) {
    conditions.push(`ct.chain_id = $${nextParamIdx++}`);
    sqlParams.push(chainId);
  }
  if (params.p2pTier !== undefined && params.p2pTier !== null) {
    conditions.push(`ct.p2p_tier = $${nextParamIdx++}`);
    sqlParams.push(params.p2pTier);
  }

  const sql = `
    SELECT
      ct.prev_week_start::text,
      ct.week_start::text,
      ct.prev_stable_cluster_id::text,
      ct.stable_cluster_id::text,
      ct.intersection_nodes::text,
      ct.jaccard::text,
      ct.overlap_prev::text,
      ct.overlap_new::text,
      ct.is_primary
    FROM analytics.cluster_transitions_weekly ct
    WHERE ${conditions.join(" AND ")}
    ORDER BY ct.week_start DESC
    LIMIT 100
  `;

  const rows = await query<RawClusterTransitionRow>(sql, sqlParams);

  return rows.map((row) => ({
    prevWeekStart: row.prev_week_start.split("T")[0],
    weekStart: row.week_start.split("T")[0],
    prevStableClusterId: parseInt(row.prev_stable_cluster_id, 10),
    stableClusterId: parseInt(row.stable_cluster_id, 10),
    intersectionNodes: parseInt(row.intersection_nodes, 10),
    jaccard: parseFloat(row.jaccard),
    overlapPrev: parseFloat(row.overlap_prev),
    overlapNew: parseFloat(row.overlap_new),
    isPrimary: row.is_primary,
  }));
}

/**
 * Get node-to-cluster assignments for graph integration
 */
export async function getNodeClusterAssignments(
  params: ClusterParams
): Promise<Map<string, number>> {
  const tokenId = await resolveTokenId(params.token);
  const chainId = await resolveChainId(params.chain);

  const { conditions, sqlParams } = buildClusterConditions(params, tokenId, chainId, "cm");

  const sql = `
    SELECT
      cm.address,
      cm.stable_cluster_id::text
    FROM analytics.cluster_members_weekly cm
    WHERE ${conditions.join(" AND ")}
  `;

  const rows = await query<RawNodeClusterRow>(sql, sqlParams);

  const assignments = new Map<string, number>();
  for (const row of rows) {
    assignments.set(row.address.toLowerCase(), parseInt(row.stable_cluster_id, 10));
  }

  return assignments;
}
