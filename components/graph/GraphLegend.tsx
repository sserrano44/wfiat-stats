"use client";

import type Graph from "graphology";
import { COMMUNITY_COLORS } from "./utils/communityColors";

interface GraphLegendProps {
  graph: Graph | null;
  focusedCommunity: number | null;
  onFocusCommunity: (communityId: number | null) => void;
}

export function GraphLegend({
  graph,
  focusedCommunity,
  onFocusCommunity,
}: GraphLegendProps) {
  if (!graph || graph.order === 0) {
    return null;
  }

  // Count nodes per community
  const communityStats = new Map<number, number>();
  graph.forEachNode((_node, attrs) => {
    const communityId = attrs.community as number;
    communityStats.set(communityId, (communityStats.get(communityId) || 0) + 1);
  });

  // Sort by size descending
  const sortedCommunities = Array.from(communityStats.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10); // Show top 10

  if (sortedCommunities.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold text-zinc-900 dark:text-white">
          Clusters
        </h4>
        {focusedCommunity !== null && (
          <button
            onClick={() => onFocusCommunity(null)}
            className="text-xs text-blue-500 hover:text-blue-600"
          >
            Show All
          </button>
        )}
      </div>
      <div className="space-y-1">
        {sortedCommunities.map(([communityId, count]) => (
          <button
            key={communityId}
            onClick={() =>
              onFocusCommunity(
                focusedCommunity === communityId ? null : communityId
              )
            }
            className={`flex w-full items-center justify-between rounded px-2 py-1 text-xs transition-colors ${
              focusedCommunity === communityId
                ? "bg-zinc-100 dark:bg-zinc-800"
                : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor:
                    COMMUNITY_COLORS[communityId % COMMUNITY_COLORS.length],
                }}
              />
              <span className="text-zinc-700 dark:text-zinc-300">
                Cluster {communityId}
              </span>
            </div>
            <span className="text-zinc-500 dark:text-zinc-400">
              {count} nodes
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
