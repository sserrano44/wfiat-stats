"use client";

import { getCommunityColor } from "@/components/graph/utils/communityColors";
import { formatCompact, truncateAddress, formatWeek } from "@/lib/utils/format";
import type { ClusterSummary } from "@/lib/types/clusters";

interface ClustersListProps {
  clusters: ClusterSummary[];
  selectedClusterId: number | null;
  onSelectCluster: (clusterId: number) => void;
  isLoading?: boolean;
}

export function ClustersList({
  clusters,
  selectedClusterId,
  onSelectCluster,
  isLoading = false,
}: ClustersListProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded mb-2" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-14 bg-zinc-100 dark:bg-zinc-800 rounded mb-1"
          />
        ))}
      </div>
    );
  }

  if (clusters.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-zinc-500">
        No clusters found for this week
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-700">
            <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
              Cluster
            </th>
            <th className="px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400">
              Nodes
            </th>
            <th className="px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400">
              Edges
            </th>
            <th className="px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400">
              Volume
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
              Top Node
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
              First Seen
            </th>
          </tr>
        </thead>
        <tbody>
          {clusters.map((cluster) => {
            const isSelected = selectedClusterId === cluster.stableClusterId;
            const color = getCommunityColor(cluster.stableClusterId);

            return (
              <tr
                key={cluster.stableClusterId}
                onClick={() => onSelectCluster(cluster.stableClusterId)}
                className={`border-b border-zinc-100 cursor-pointer transition-colors dark:border-zinc-800 ${
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-medium text-zinc-900 dark:text-white">
                      #{cluster.stableClusterId}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-zinc-900 dark:text-zinc-100">
                  {cluster.nodeCount.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-zinc-900 dark:text-zinc-100">
                  {cluster.edgeCount.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-zinc-900 dark:text-zinc-100">
                  {formatCompact(cluster.totalWeight)}
                </td>
                <td className="px-4 py-3">
                  <code className="text-xs text-zinc-600 dark:text-zinc-400">
                    {truncateAddress(cluster.topNodeAddress, 6)}
                  </code>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                  {formatWeek(cluster.createdWeekStart)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
