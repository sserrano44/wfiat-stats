"use client";

import { Suspense } from "react";
import { FilterBar } from "@/components/filters/FilterBar";
import { MetricCardGrid } from "@/components/cards/MetricCardGrid";
import { ChartContainer } from "@/components/charts/ChartContainer";
import { AreaChart } from "@/components/charts/AreaChart";
import { LineChart } from "@/components/charts/LineChart";
import { useDexData } from "@/hooks/useDashboardData";
import { CardSkeleton, ChartSkeleton } from "@/components/ui/Skeleton";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { formatNumber } from "@/lib/utils/format";

function DexContent() {
  const { data, error, isLoading, refresh } = useDexData();

  if (error) {
    return <ErrorAlert title="Failed to load DEX data" message={error} onRetry={refresh} />;
  }

  const metrics = data?.aggregates
    ? [
        { title: "Total DEX Trades", value: data.aggregates.totalTradeCount, format: "number" as const },
        { title: "Unique Traders", value: data.aggregates.totalUniqueTraders, format: "number" as const, subtitle: "Peak daily" },
        { title: "wFiat Volume", value: data.aggregates.totalWfiatVolume },
      ]
    : [];

  // Filter out undefined ratio values for chart
  const ratioData = data?.timeSeries.filter(
    (point) =>
      point.p2pToTradeCountRatio !== undefined &&
      point.p2pToTradeVolumeRatio !== undefined
  ) || [];

  return (
    <div className="space-y-6">
      <MetricCardGrid metrics={metrics} isLoading={isLoading} columns={3} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartContainer
          title="DEX Trading Volume"
          subtitle="Daily wFiat volume on DEXes"
          isLoading={isLoading}
          error={error}
          onRetry={refresh}
        >
          <AreaChart
            data={data?.timeSeries || []}
            xKey="day"
            areas={[
              { dataKey: "wfiatVolume", name: "wFiat Volume", color: "#f59e0b" },
            ]}
          />
        </ChartContainer>

        <ChartContainer
          title="Trade Count"
          subtitle="Daily number of DEX swaps"
          isLoading={isLoading}
          error={error}
          onRetry={refresh}
        >
          <AreaChart
            data={data?.timeSeries || []}
            xKey="day"
            areas={[
              { dataKey: "tradeCount", name: "Trades", color: "#3b82f6" },
            ]}
          />
        </ChartContainer>

        <ChartContainer
          title="Unique Traders"
          subtitle="Daily unique addresses trading on DEXes"
          isLoading={isLoading}
          error={error}
          onRetry={refresh}
        >
          <AreaChart
            data={data?.timeSeries || []}
            xKey="day"
            areas={[
              { dataKey: "uniqueTraders", name: "Unique Traders", color: "#10b981" },
            ]}
          />
        </ChartContainer>

        <ChartContainer
          title="Transfer-to-Trade Ratio"
          subtitle="P2P T1 activity relative to DEX trading"
          isLoading={isLoading}
          error={error}
          onRetry={refresh}
        >
          {ratioData.length > 0 ? (
            <LineChart
              data={ratioData}
              xKey="day"
              lines={[
                {
                  dataKey: "p2pToTradeCountRatio",
                  name: "Count Ratio (P2P/DEX)",
                  color: "#8b5cf6",
                },
                {
                  dataKey: "p2pToTradeVolumeRatio",
                  name: "Volume Ratio (P2P/DEX)",
                  color: "#ec4899",
                },
              ]}
              formatY={(v) => formatNumber(v, 2)}
            />
          ) : (
            <div className="flex h-64 items-center justify-center text-zinc-500">
              Insufficient data for ratio calculation
            </div>
          )}
        </ChartContainer>
      </div>
    </div>
  );
}

export default function DexPage() {
  return (
    <div className="space-y-6">
      <FilterBar />
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <ChartSkeleton key={i} />
              ))}
            </div>
          </div>
        }
      >
        <DexContent />
      </Suspense>
    </div>
  );
}
