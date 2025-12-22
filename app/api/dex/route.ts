import { NextRequest, NextResponse } from "next/server";
import { getDexTimeSeries, getDexAggregates } from "@/lib/server/queries/dex";
import { parseFilterParams } from "@/lib/validation/filters";
import type { DexResponse, ApiError } from "@/lib/types/api";

// Force dynamic rendering (uses search params)
export const dynamic = "force-dynamic";
// Cache for 5 minutes
export const revalidate = 300;

export async function GET(
  request: NextRequest
): Promise<NextResponse<DexResponse | ApiError>> {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Validate and parse filter params
    let filters;
    try {
      filters = parseFilterParams(searchParams);
    } catch (error) {
      return NextResponse.json(
        {
          error: "Invalid parameters",
          details: error instanceof Error ? error.message : "Validation failed",
        },
        { status: 400 }
      );
    }

    // Fetch data in parallel
    const [timeSeries, aggregates] = await Promise.all([
      getDexTimeSeries(filters),
      getDexAggregates(filters),
    ]);

    return NextResponse.json({
      timeSeries,
      aggregates,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("DEX API error:", error);

    // Check for analytics table missing
    if (
      error instanceof Error &&
      error.message.includes("analytics.metrics_daily")
    ) {
      return NextResponse.json(
        {
          error: "DEX analytics tables not available",
          fallback: true,
          message: "DEX analytics data is being computed.",
        },
        { status: 503 }
      );
    }

    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return NextResponse.json(
        {
          error: "Database configuration error",
          message: "Please check your DATABASE_URL environment variable.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
