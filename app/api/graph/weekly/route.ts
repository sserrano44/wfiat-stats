import { NextRequest, NextResponse } from "next/server";
import { getGraphData } from "@/lib/server/queries/graph";
import { parseGraphParams } from "@/lib/validation/graph";
import type { GraphResponse } from "@/lib/types/graph";
import type { ApiError } from "@/lib/types/api";

// Force dynamic rendering (uses search params)
export const dynamic = "force-dynamic";
// Cache for 5 minutes
export const revalidate = 300;

export async function GET(
  request: NextRequest
): Promise<NextResponse<GraphResponse | ApiError>> {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Validate and parse params
    let params;
    try {
      params = parseGraphParams(searchParams);
    } catch (error) {
      return NextResponse.json(
        {
          error: "Invalid parameters",
          details: error instanceof Error ? error.message : "Validation failed",
        },
        { status: 400 }
      );
    }

    // Check for required week_start
    if (!params.weekStart) {
      return NextResponse.json(
        {
          error: "Missing required parameter",
          details: "week_start is required",
        },
        { status: 400 }
      );
    }

    // Fetch graph data
    const graphData = await getGraphData(params);

    return NextResponse.json({
      ...graphData,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Graph API error:", error);

    // Check for analytics table missing
    if (
      error instanceof Error &&
      error.message.includes("analytics.edges_weekly")
    ) {
      return NextResponse.json(
        {
          error: "Graph data not available",
          fallback: true,
          message: "The analytics.edges_weekly table is not available. Run analytics jobs first.",
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
