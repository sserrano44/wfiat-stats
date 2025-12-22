import { NextRequest, NextResponse } from "next/server";
import {
  getNetworkTimeSeries,
  getTopCorridors,
  getAvailableWeeks,
} from "@/lib/server/queries/network";
import { parseFilterParams } from "@/lib/validation/filters";
import type { NetworkResponse, ApiError } from "@/lib/types/api";

// Force dynamic rendering (uses search params)
export const dynamic = "force-dynamic";
// Cache for 5 minutes
export const revalidate = 300;

export async function GET(
  request: NextRequest
): Promise<NextResponse<NetworkResponse | ApiError>> {
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

    // Get selected week for corridors (default to most recent)
    const weekParam = searchParams.get("week");
    let selectedWeek: Date;

    if (weekParam) {
      selectedWeek = new Date(weekParam);
    } else {
      // Get most recent available week
      const weeks = await getAvailableWeeks(filters);
      if (weeks.length === 0) {
        return NextResponse.json({
          timeSeries: [],
          topCorridors: [],
          generatedAt: new Date().toISOString(),
        });
      }
      selectedWeek = new Date(weeks[0]);
    }

    // Fetch data in parallel
    const [timeSeries, topCorridors] = await Promise.all([
      getNetworkTimeSeries(filters),
      getTopCorridors(filters, selectedWeek, "volume", 50),
    ]);

    return NextResponse.json({
      timeSeries,
      topCorridors,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Network API error:", error);

    // Check for analytics table missing
    if (
      error instanceof Error &&
      error.message.includes("analytics.network_weekly")
    ) {
      return NextResponse.json(
        {
          error: "Network analytics tables not available",
          fallback: true,
          message:
            "Network analytics data is being computed. Please run network jobs first.",
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
