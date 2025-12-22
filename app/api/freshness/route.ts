import { NextResponse } from "next/server";
import { getSyncState } from "@/lib/server/queries/freshness";
import type { FreshnessResponse, ApiError } from "@/lib/types/api";

export const dynamic = "force-dynamic";
export const revalidate = 60; // Cache for 1 minute

export async function GET(): Promise<NextResponse<FreshnessResponse | ApiError>> {
  try {
    const items = await getSyncState();

    return NextResponse.json({
      items,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Freshness API error:", error);

    if (error instanceof Error && error.message.includes("sync_state")) {
      return NextResponse.json(
        {
          error: "Sync state not available",
          message: "The sync_state table may not exist yet.",
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
