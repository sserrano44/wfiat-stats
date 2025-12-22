import { NextRequest, NextResponse } from "next/server";
import {
  getOverviewMetrics,
  getOverviewTimeSeries,
} from "@/lib/server/queries/overview";
import { parseFilterParams } from "@/lib/validation/filters";
import type { OverviewResponse, ApiError } from "@/lib/types/api";

// Force dynamic rendering (uses search params)
export const dynamic = "force-dynamic";
// Cache for 5 minutes
export const revalidate = 300;

export async function GET(
  request: NextRequest
): Promise<NextResponse<OverviewResponse | ApiError>> {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Check for cache bypass
    const noCache = searchParams.get("nocache") === "1";
    if (noCache) {
      // Force fresh data
    }

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
    const [metrics, timeSeries] = await Promise.all([
      getOverviewMetrics(filters),
      getOverviewTimeSeries(filters),
    ]);

    return NextResponse.json({
      metrics,
      timeSeries,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Overview API error:", error);

    // Check for analytics table missing
    if (
      error instanceof Error &&
      error.message.includes("analytics.metrics_daily")
    ) {
      return NextResponse.json(
        {
          error: "Analytics tables not available",
          fallback: true,
          message:
            "Analytics data is being computed. Please run analytics jobs first.",
        },
        { status: 503 }
      );
    }

    // Check for database connection issues
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
