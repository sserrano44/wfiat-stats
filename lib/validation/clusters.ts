import { z } from "zod";
import { tokenSchema, chainSchema, p2pTierSchema } from "./filters";

const weekStartSchema = z
  .string()
  .refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid week_start date",
  });

export const clusterParamsSchema = z.object({
  token: tokenSchema.nullable().transform((v) => v ?? "all"),
  chain: chainSchema.nullable().transform((v) => v ?? "all"),
  weekStart: weekStartSchema,
  p2pTier: p2pTierSchema.transform((v) => v ?? 2), // Default to tier 2 for clustering
});

export const clusterDetailParamsSchema = clusterParamsSchema.extend({
  stableClusterId: z.coerce.number().int().positive(),
});

export type ClusterParams = z.infer<typeof clusterParamsSchema>;
export type ClusterDetailParams = z.infer<typeof clusterDetailParamsSchema>;

export function parseClusterParams(searchParams: URLSearchParams): ClusterParams {
  return clusterParamsSchema.parse({
    token: searchParams.get("token"),
    chain: searchParams.get("chain"),
    weekStart: searchParams.get("week_start"),
    p2pTier: searchParams.get("tier"),
  });
}

export function parseClusterDetailParams(
  searchParams: URLSearchParams,
  clusterId: string
): ClusterDetailParams {
  return clusterDetailParamsSchema.parse({
    token: searchParams.get("token"),
    chain: searchParams.get("chain"),
    weekStart: searchParams.get("week_start"),
    p2pTier: searchParams.get("tier"),
    stableClusterId: clusterId,
  });
}
