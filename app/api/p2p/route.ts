import { NextRequest, NextResponse } from "next/server";
import { getP2PTimeSeries, getTopP2PPairs } from "@/lib/server/queries/p2p";
import { parseFilterParams } from "@/lib/validation/filters";
import type { P2PResponse, ApiError } from "@/lib/types/api";

// Force dynamic rendering (uses search params)
export const dynamic = "force-dynamic";
// Cache for 5 minutes
export const revalidate = 300;

export async function GET(
  request: NextRequest
): Promise<NextResponse<P2PResponse | ApiError>> {
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
    const [timeSeries, topPairs] = await Promise.all([
      getP2PTimeSeries(filters),
      getTopP2PPairs(filters, 50),
    ]);

    return NextResponse.json({
      timeSeries,
      topPairs,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("P2P API error:", error);

    // Check for analytics table missing
    if (
      error instanceof Error &&
      (error.message.includes("analytics.metrics_daily") ||
        error.message.includes("analytics.edges_weekly"))
    ) {
      return NextResponse.json(
        {
          error: "P2P analytics tables not available",
          fallback: true,
          message:
            "P2P analytics data is being computed. Please run analytics jobs first.",
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
