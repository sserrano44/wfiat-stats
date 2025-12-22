"use client";

import { Suspense } from "react";
import { FilterBar } from "@/components/filters/FilterBar";
import { MetricCardGrid } from "@/components/cards/MetricCardGrid";
import { ChartContainer } from "@/components/charts/ChartContainer";
import { AreaChart } from "@/components/charts/AreaChart";
import { LineChart } from "@/components/charts/LineChart";
import { DataTable } from "@/components/tables/DataTable";
import { useP2PData } from "@/hooks/useDashboardData";
import { CardSkeleton, ChartSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { formatNumber, formatPercent, truncateAddress } from "@/lib/utils/format";

function P2PContent() {
  const { data, error, isLoading, refresh } = useP2PData();

  if (error) {
    return <ErrorAlert title="Failed to load P2P data" message={error} onRetry={refresh} />;
  }

  // Calculate period aggregates from time series
  const totals = data?.timeSeries.reduce(
    (acc, point) => ({
      t1Count: acc.t1Count + point.t1Count,
      t1Volume: acc.t1Volume + point.t1Volume,
      t1Users: Math.max(acc.t1Users, point.t1ActiveUsers),
      t2Count: acc.t2Count + point.t2Count,
      t2Volume: acc.t2Volume + point.t2Volume,
      t2Users: Math.max(acc.t2Users, point.t2ActiveUsers),
      transferCount: acc.transferCount + point.transferCount,
    }),
    { t1Count: 0, t1Volume: 0, t1Users: 0, t2Count: 0, t2Volume: 0, t2Users: 0, transferCount: 0 }
  ) || { t1Count: 0, t1Volume: 0, t1Users: 0, t2Count: 0, t2Volume: 0, t2Users: 0, transferCount: 0 };

  const metrics = [
    { title: "T1 Transfers", value: totals.t1Count, format: "number" as const },
    { title: "T1 Volume", value: totals.t1Volume },
    {
      title: "T1 Share (count)",
      value: totals.transferCount > 0 ? totals.t1Count / totals.transferCount : 0,
      format: "percent" as const
    },
    { title: "T2 Transfers", value: totals.t2Count, format: "number" as const },
    { title: "T2 Volume", value: totals.t2Volume },
    {
      title: "T2 Share (count)",
      value: totals.transferCount > 0 ? totals.t2Count / totals.transferCount : 0,
      format: "percent" as const
    },
  ];

  const topPairsColumns = [
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

  return (
    <div className="space-y-6">
      <MetricCardGrid metrics={metrics} isLoading={isLoading} columns={6} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartContainer
          title="P2P Volume by Tier"
          subtitle="Daily transfer volume for Tier 1 and Tier 2"
          isLoading={isLoading}
          error={error}
          onRetry={refresh}
        >
          <AreaChart
            data={data?.timeSeries || []}
            xKey="day"
            areas={[
              { dataKey: "t1Volume", name: "Tier 1 Volume", color: "#8b5cf6" },
              { dataKey: "t2Volume", name: "Tier 2 Volume", color: "#ec4899" },
            ]}
            stacked
          />
        </ChartContainer>

        <ChartContainer
          title="P2P Share of Transfers"
          subtitle="Tier 1 and Tier 2 as percentage of total transfers"
          isLoading={isLoading}
          error={error}
          onRetry={refresh}
        >
          <LineChart
            data={data?.timeSeries || []}
            xKey="day"
            lines={[
              { dataKey: "t1CountShare", name: "T1 Share", color: "#8b5cf6" },
              { dataKey: "t2CountShare", name: "T2 Share", color: "#ec4899" },
            ]}
            formatY={(v) => formatPercent(v)}
          />
        </ChartContainer>
      </div>

      <ChartContainer
        title="Active Users by Tier"
        subtitle="Daily unique addresses participating in P2P transfers"
        isLoading={isLoading}
        error={error}
        onRetry={refresh}
      >
        <AreaChart
          data={data?.timeSeries || []}
          xKey="day"
          areas={[
            { dataKey: "t1ActiveUsers", name: "Tier 1 Users", color: "#8b5cf6" },
            { dataKey: "t2ActiveUsers", name: "Tier 2 Users", color: "#ec4899" },
          ]}
        />
      </ChartContainer>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-white">
          Top P2P Corridors
        </h3>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Most active address pairs by volume (aggregated over selected period)
        </p>
        <DataTable
          data={(data?.topPairs || []).map((pair, idx) => ({ ...pair, _idx: idx }))}
          columns={topPairsColumns}
          keyField="_idx"
          isLoading={isLoading}
          emptyMessage="No P2P corridors found"
        />
      </div>
    </div>
  );
}

export default function P2PPage() {
  return (
    <div className="space-y-6">
      <FilterBar showP2PTier />
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <ChartSkeleton key={i} />
              ))}
            </div>
            <ChartSkeleton />
            <TableSkeleton rows={10} />
          </div>
        }
      >
        <P2PContent />
      </Suspense>
    </div>
  );
}
