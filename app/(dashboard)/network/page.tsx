"use client";

import { Suspense, useState } from "react";
import { FilterBar } from "@/components/filters/FilterBar";
import { MetricCardGrid } from "@/components/cards/MetricCardGrid";
import { ChartContainer } from "@/components/charts/ChartContainer";
import { LineChart } from "@/components/charts/LineChart";
import { AreaChart } from "@/components/charts/AreaChart";
import { DataTable } from "@/components/tables/DataTable";
import { useNetworkData } from "@/hooks/useDashboardData";
import { CardSkeleton, ChartSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { formatNumber, formatPercent, truncateAddress, formatWeek } from "@/lib/utils/format";

function NetworkContent() {
  const [selectedWeek, setSelectedWeek] = useState<string | undefined>(undefined);
  const { data, error, isLoading, refresh } = useNetworkData(selectedWeek);

  if (error) {
    return <ErrorAlert title="Failed to load network data" message={error} onRetry={refresh} />;
  }

  // Get latest week's data for KPIs
  const latestData = data?.timeSeries?.[data.timeSeries.length - 1];

  const metrics = latestData
    ? [
        { title: "Network Nodes", value: latestData.nodes, format: "number" as const },
        { title: "Network Edges", value: latestData.edges, format: "number" as const },
        { title: "New Nodes (week)", value: latestData.newNodes, format: "number" as const },
        { title: "New Edges (week)", value: latestData.newEdges, format: "number" as const },
        { title: "LCC Fraction", value: latestData.lccFraction, format: "percent" as const, subtitle: "Network cohesion" },
        { title: "Reciprocity Rate", value: latestData.reciprocityRate, format: "percent" as const },
        { title: "Repeat Pair Share", value: latestData.repeatPairShare, format: "percent" as const },
        { title: "Avg Degree", value: latestData.avgDegree, format: "number" as const },
      ]
    : [];

  const corridorColumns = [
    {
      key: "fromAddress",
      header: "From",
      render: (value: unknown) => (
        <code className="text-xs">{truncateAddress(String(value))}</code>
      ),
    },
    {
      key: "toAddress",
      header: "To",
      render: (value: unknown) => (
        <code className="text-xs">{truncateAddress(String(value))}</code>
      ),
    },
    {
      key: "txCount",
      header: "Transfers",
      align: "right" as const,
      sortable: true,
      render: (value: unknown) => formatNumber(Number(value), 0),
    },
    {
      key: "volume",
      header: "Volume",
      align: "right" as const,
      sortable: true,
      render: (value: unknown) => formatNumber(Number(value)),
    },
  ];

  // Get available weeks for selector (deduplicated)
  const availableWeeks = [...new Set(data?.timeSeries.map((d) => d.weekStart) || [])];

  return (
    <div className="space-y-6">
      <MetricCardGrid metrics={metrics} isLoading={isLoading} columns={4} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartContainer
          title="Network Growth"
          subtitle="Weekly nodes and edges over time"
          isLoading={isLoading}
          error={error}
          onRetry={refresh}
        >
          <LineChart
            data={data?.timeSeries || []}
            xKey="weekStart"
            lines={[
              { dataKey: "nodes", name: "Nodes", color: "#3b82f6" },
              { dataKey: "edges", name: "Edges", color: "#10b981" },
            ]}
          />
        </ChartContainer>

        <ChartContainer
          title="New Participants"
          subtitle="Weekly new nodes and edges"
          isLoading={isLoading}
          error={error}
          onRetry={refresh}
        >
          <AreaChart
            data={data?.timeSeries || []}
            xKey="weekStart"
            areas={[
              { dataKey: "newNodes", name: "New Nodes", color: "#8b5cf6" },
              { dataKey: "newEdges", name: "New Edges", color: "#ec4899" },
            ]}
          />
        </ChartContainer>

        <ChartContainer
          title="Network Cohesion"
          subtitle="LCC fraction (largest connected component)"
          isLoading={isLoading}
          error={error}
          onRetry={refresh}
        >
          <LineChart
            data={data?.timeSeries || []}
            xKey="weekStart"
            lines={[{ dataKey: "lccFraction", name: "LCC Fraction", color: "#f59e0b" }]}
            formatY={(v) => formatPercent(v)}
          />
        </ChartContainer>

        <ChartContainer
          title="Relationship Patterns"
          subtitle="Reciprocity and repeat pair share"
          isLoading={isLoading}
          error={error}
          onRetry={refresh}
        >
          <LineChart
            data={data?.timeSeries || []}
            xKey="weekStart"
            lines={[
              { dataKey: "reciprocityRate", name: "Reciprocity", color: "#06b6d4" },
              { dataKey: "repeatPairShare", name: "Repeat Pairs", color: "#84cc16" },
            ]}
            formatY={(v) => formatPercent(v)}
          />
        </ChartContainer>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
              Top P2P Corridors
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Most active address pairs for selected week
            </p>
          </div>
          {availableWeeks.length > 0 && (
            <select
              value={selectedWeek || availableWeeks[0]}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            >
              {availableWeeks.map((week) => (
                <option key={week} value={week}>
                  {formatWeek(week)}
                </option>
              ))}
            </select>
          )}
        </div>
        <DataTable
          data={(data?.topCorridors || []).map((corridor, idx) => ({ ...corridor, _idx: idx }))}
          columns={corridorColumns}
          keyField="_idx"
          isLoading={isLoading}
          emptyMessage="No corridors found for this week"
        />
      </div>
    </div>
  );
}

export default function NetworkPage() {
  return (
    <div className="space-y-6">
      <FilterBar showP2PTier />
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <ChartSkeleton key={i} />
              ))}
            </div>
            <TableSkeleton rows={10} />
          </div>
        }
      >
        <NetworkContent />
      </Suspense>
    </div>
  );
}
