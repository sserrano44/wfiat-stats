import { NextResponse } from "next/server";
import { getTokens, getChains } from "@/lib/server/queries/filters";
import type { FiltersResponse, ApiError } from "@/lib/types/api";

// Cache filter options for 1 hour (static data)
export const revalidate = 3600;

export async function GET(): Promise<NextResponse<FiltersResponse | ApiError>> {
  try {
    const [tokens, chains] = await Promise.all([getTokens(), getChains()]);

    return NextResponse.json({
      tokens: tokens.map((t) => ({
        id: t.id,
        symbol: t.symbol,
        name: t.name,
        decimals: t.decimals,
      })),
      chains: chains.map((c) => ({
        id: c.id,
        name: c.name,
        evmChainId: c.evmChainId,
      })),
    });
  } catch (error) {
    console.error("Filters API error:", error);

    // Check for database connection issues
    if (error instanceof Error) {
      if (error.message.includes("DATABASE_URL")) {
        return NextResponse.json(
          {
            error: "Database configuration error",
            message: error.message,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to load filter options" },
      { status: 500 }
    );
  }
}
