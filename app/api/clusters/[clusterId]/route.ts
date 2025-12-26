import { NextRequest, NextResponse } from "next/server";
import {
  getClusterById,
  getClusterMembers,
  getClusterHistory,
  getClusterTransitions,
} from "@/lib/server/queries/clusters";
import { parseClusterDetailParams } from "@/lib/validation/clusters";
import type { ClusterDetailResponse } from "@/lib/types/clusters";
import type { ApiError } from "@/lib/types/api";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clusterId: string }> }
): Promise<NextResponse<ClusterDetailResponse | ApiError>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const { clusterId } = await params;

    let clusterParams;
    try {
      clusterParams = parseClusterDetailParams(searchParams, clusterId);
    } catch (error) {
      return NextResponse.json(
        {
          error: "Invalid parameters",
          details: error instanceof Error ? error.message : "Validation failed",
        },
        { status: 400 }
      );
    }

    const [cluster, members, history, transitions] = await Promise.all([
      getClusterById(clusterParams),
      getClusterMembers(clusterParams),
      getClusterHistory(clusterParams),
      getClusterTransitions(clusterParams),
    ]);

    if (!cluster) {
      return NextResponse.json(
        { error: "Cluster not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      cluster,
      members,
      history,
      transitions,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cluster detail API error:", error);

    if (
      error instanceof Error &&
      error.message.includes("analytics.cluster")
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
