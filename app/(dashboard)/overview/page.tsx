"use client";

import { Suspense } from "react";
import { FilterBar } from "@/components/filters/FilterBar";
import { MetricCardGrid } from "@/components/cards/MetricCardGrid";
import { ChartContainer } from "@/components/charts/ChartContainer";
import { AreaChart } from "@/components/charts/AreaChart";
import { BarChart } from "@/components/charts/BarChart";
import { useOverviewData } from "@/hooks/useDashboardData";
import { CardSkeleton, ChartSkeleton } from "@/components/ui/Skeleton";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

function OverviewContent() {
  const { data, error, isLoading, refresh } = useOverviewData();

  if (error) {
    return <ErrorAlert title="Failed to load overview" message={error} onRetry={refresh} />;
  }

  const metrics = data?.metrics
    ? [
        { title: "Net Issuance", value: data.metrics.netIssuance, subtitle: "Minted - Burned" },
        { title: "Minted Volume", value: data.metrics.mintedVolume },
        { title: "Burned Volume", value: data.metrics.burnedVolume },
        { title: "Total Transfers", value: data.metrics.transferCount, format: "number" as const },
        { title: "P2P T1 Volume", value: data.metrics.p2pT1Volume },
        { title: "P2P T1 Active Users", value: data.metrics.p2pT1ActiveUsers, format: "number" as const },
        { title: "P2P T2 Volume", value: data.metrics.p2pT2Volume },
        { title: "P2P T2 Active Users", value: data.metrics.p2pT2ActiveUsers, format: "number" as const },
        { title: "DEX Trades", value: data.metrics.dexTradeCount, format: "number" as const },
        { title: "DEX Unique Traders", value: data.metrics.dexUniqueTraders, format: "number" as const },
      ]
    : [];

  return (
    <div className="space-y-6">
      <MetricCardGrid metrics={metrics} isLoading={isLoading} columns={5} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartContainer
          title="Minted vs Burned Volume"
          subtitle="Daily comparison of token issuance and redemption"
          isLoading={isLoading}
          error={error}
          onRetry={refresh}
        >
          <BarChart
            data={data?.timeSeries || []}
            xKey="day"
            bars={[
              { dataKey: "mintedVolume", name: "Minted", color: "#22c55e" },
              { dataKey: "burnedVolume", name: "Burned", color: "#ef4444" },
            ]}
            stacked={false}
          />
        </ChartContainer>

        <ChartContainer
          title="Net Issuance"
          subtitle="Daily net change in token supply"
          isLoading={isLoading}
          error={error}
          onRetry={refresh}
        >
          <AreaChart
            data={data?.timeSeries || []}
            xKey="day"
            areas={[
              { dataKey: "netIssuance", name: "Net Issuance", color: "#3b82f6" },
            ]}
          />
        </ChartContainer>

        <ChartContainer
          title="P2P Active Users"
          subtitle="Daily active users by tier"
          isLoading={isLoading}
          error={error}
          onRetry={refresh}
        >
          <AreaChart
            data={data?.timeSeries || []}
            xKey="day"
            areas={[
              { dataKey: "p2pT1ActiveUsers", name: "Tier 1 Users", color: "#8b5cf6" },
              { dataKey: "p2pT2ActiveUsers", name: "Tier 2 Users", color: "#ec4899" },
            ]}
          />
        </ChartContainer>

        <ChartContainer
          title="DEX Trading Activity"
          subtitle="Daily DEX trade count"
          isLoading={isLoading}
          error={error}
          onRetry={refresh}
        >
          <AreaChart
            data={data?.timeSeries || []}
            xKey="day"
            areas={[
              { dataKey: "dexTradeCount", name: "Trades", color: "#f59e0b" },
            ]}
          />
        </ChartContainer>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <FilterBar />
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
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
        <OverviewContent />
      </Suspense>
    </div>
  );
}
