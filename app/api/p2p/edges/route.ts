import { NextRequest, NextResponse } from "next/server";
import { getTopP2PPairs } from "@/lib/server/queries/p2p";
import { parseFilterParams } from "@/lib/validation/filters";
import type { P2PPair, ApiError } from "@/lib/types/api";

// Force dynamic rendering (uses search params)
export const dynamic = "force-dynamic";
// Cache for 5 minutes
export const revalidate = 300;

interface EdgesResponse {
  edges: P2PPair[];
  generatedAt: string;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<EdgesResponse | ApiError>> {
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

    // Get limit from query params (default 50, max 100)
    const limitParam = searchParams.get("limit");
    let limit = 50;
    if (limitParam) {
      const parsed = parseInt(limitParam, 10);
      if (!isNaN(parsed) && parsed > 0) {
        limit = Math.min(parsed, 100);
      }
    }

    const edges = await getTopP2PPairs(filters, limit);

    return NextResponse.json({
      edges,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("P2P edges API error:", error);

    if (
      error instanceof Error &&
      error.message.includes("analytics.edges_weekly")
    ) {
      return NextResponse.json(
        {
          error: "Edges analytics tables not available",
          fallback: true,
          message: "P2P edges data is being computed.",
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
