import { z } from "zod";
import { tokenSchema, chainSchema, p2pTierSchema } from "./filters";

export const metricSchema = z.enum(["volume", "txCount"]).default("volume");

export const graphParamsSchema = z.object({
  token: tokenSchema.nullable().transform((v) => v ?? "all"),
  chain: chainSchema.nullable().transform((v) => v ?? "all"),
  weekStart: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid week_start date" }),
  tier: p2pTierSchema,
  metric: metricSchema.nullable().transform((v) => v ?? "volume"),
  minEdge: z.coerce.number().min(0).default(0),
  maxNodes: z.coerce.number().min(10).max(10000).default(1000),
});

export type GraphParams = z.infer<typeof graphParamsSchema>;

export function parseGraphParams(searchParams: URLSearchParams): GraphParams {
  return graphParamsSchema.parse({
    token: searchParams.get("token"),
    chain: searchParams.get("chain"),
    weekStart: searchParams.get("week_start"),
    tier: searchParams.get("tier"),
    metric: searchParams.get("metric"),
    minEdge: searchParams.get("min_edge"),
    maxNodes: searchParams.get("max_nodes"),
  });
}
