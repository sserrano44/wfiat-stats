"use client";

import { LineChart } from "@/components/charts/LineChart";
import type { ClusterHistoryPoint } from "@/lib/types/clusters";

interface ClusterHistoryChartProps {
  history: ClusterHistoryPoint[];
  isLoading?: boolean;
}

export function ClusterHistoryChart({
  history,
  isLoading = false,
}: ClusterHistoryChartProps) {
  if (isLoading) {
    return (
      <div className="h-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-zinc-500">
        No history available
      </div>
    );
  }

  return (
    <LineChart
      data={history}
      xKey="weekStart"
      height={180}
      lines={[
        {
          dataKey: "nodeCount",
          name: "Nodes",
          color: "#3b82f6",
        },
        {
          dataKey: "edgeCount",
          name: "Edges",
          color: "#10b981",
          strokeDasharray: "5 5",
        },
      ]}
      formatY={(v) => v.toLocaleString()}
    />
  );
}
