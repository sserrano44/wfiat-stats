import { z } from "zod";

export const tokenSchema = z
  .enum(["wARS", "wBRL", "wMXN", "wCOP", "wPEN", "wCLP", "all"])
  .default("all");

export const chainSchema = z
  .enum(["ethereum", "base", "worldchain", "all"])
  .default("all");

export const rangeSchema = z
  .enum(["7d", "30d", "90d", "180d", "365d", "custom"])
  .default("30d");

export const p2pTierSchema = z.coerce
  .number()
  .min(1)
  .max(3)
  .optional()
  .nullable();

// Parse date string to Date object
const dateStringSchema = z
  .string()
  .refine(
    (val) => {
      const parsed = Date.parse(val);
      return !isNaN(parsed);
    },
    { message: "Invalid date string" }
  )
  .transform((val) => new Date(val));

export const filterSchema = z
  .object({
    token: tokenSchema.nullable().transform((v) => v ?? "all"),
    chain: chainSchema.nullable().transform((v) => v ?? "all"),
    range: rangeSchema.nullable().transform((v) => v ?? "30d"),
    startDate: dateStringSchema.optional().nullable(),
    endDate: dateStringSchema.optional().nullable(),
    p2pTier: p2pTierSchema,
  })
  .transform((data) => {
    // Calculate dates from range if not custom
    let startDate = data.startDate ?? undefined;
    let endDate = data.endDate ?? undefined;

    if (data.range !== "custom") {
      const days = parseInt(data.range.replace("d", ""));
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(endDate.getDate() - days);
    }

    return {
      token: data.token,
      chain: data.chain,
      range: data.range,
      startDate,
      endDate,
      p2pTier: data.p2pTier ?? undefined,
    };
  });

export type ValidatedFilters = z.infer<typeof filterSchema>;

// Parse search params into filter object
export function parseFilterParams(
  searchParams: URLSearchParams
): ValidatedFilters {
  const result = filterSchema.parse({
    token: searchParams.get("token"),
    chain: searchParams.get("chain"),
    range: searchParams.get("range"),
    startDate: searchParams.get("startDate"),
    endDate: searchParams.get("endDate"),
    p2pTier: searchParams.get("tier"),
  });
  return result;
}

// Schema for week selection (network page)
export const weekSchema = z
  .string()
  .refine(
    (val) => {
      const parsed = Date.parse(val);
      return !isNaN(parsed);
    },
    { message: "Invalid week date" }
  )
  .transform((val) => new Date(val));
