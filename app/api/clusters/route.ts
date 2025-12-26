import { NextRequest, NextResponse } from "next/server";
import {
  getClustersForWeek,
  getClustersSummary,
} from "@/lib/server/queries/clusters";
import { parseClusterParams } from "@/lib/validation/clusters";
import type { ClustersResponse } from "@/lib/types/clusters";
import type { ApiError } from "@/lib/types/api";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function GET(
  request: NextRequest
): Promise<NextResponse<ClustersResponse | ApiError>> {
  try {
    const searchParams = request.nextUrl.searchParams;

    let params;
    try {
      params = parseClusterParams(searchParams);
    } catch (error) {
      return NextResponse.json(
        {
          error: "Invalid parameters",
          details: error instanceof Error ? error.message : "Validation failed",
        },
        { status: 400 }
      );
    }

    const [summary, clusters] = await Promise.all([
      getClustersSummary(params),
      getClustersForWeek(params),
    ]);

    return NextResponse.json({
      summary,
      clusters,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Clusters API error:", error);

    if (
      error instanceof Error &&
      error.message.includes("analytics.cluster_instances_weekly")
    ) {
      return NextResponse.json(
        {
          error: "Cluster analytics tables not available",
          fallback: true,
          message:
            "Cluster analytics data is being computed. Please run clustering jobs first.",
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
