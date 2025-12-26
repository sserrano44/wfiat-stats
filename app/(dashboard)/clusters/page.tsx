"use client";

import { useState, useMemo } from "react";
import { FilterBar } from "@/components/filters/FilterBar";
import { MetricCard } from "@/components/cards/MetricCard";
import { ClustersList } from "@/components/clusters/ClustersList";
import { ClusterDetailPanel } from "@/components/clusters/ClusterDetailPanel";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { useClustersData, useClusterDetail } from "@/hooks/useDashboardData";
import { formatWeek } from "@/lib/utils/format";

// Generate available weeks (last 12 complete weeks, excluding current incomplete week)
function getAvailableWeeks(): string[] {
  const weeks: string[] = [];
  const now = new Date();

  // Find the most recent Monday
  const dayOfWeek = now.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const currentMonday = new Date(now);
  currentMonday.setDate(now.getDate() - daysToMonday);
  currentMonday.setHours(0, 0, 0, 0);

  // Start from previous Monday (skip current incomplete week)
  const lastCompleteMonday = new Date(currentMonday);
  lastCompleteMonday.setDate(currentMonday.getDate() - 7);

  // Generate last 12 complete weeks
  for (let i = 0; i < 12; i++) {
    const weekStart = new Date(lastCompleteMonday);
    weekStart.setDate(lastCompleteMonday.getDate() - i * 7);
    weeks.push(weekStart.toISOString().split("T")[0]);
  }

  return weeks;
}

export default function ClustersPage() {
  const availableWeeks = useMemo(() => getAvailableWeeks(), []);
  const [selectedWeek, setSelectedWeek] = useState(availableWeeks[0]);
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);

  const {
    data: clustersData,
    error: clustersError,
    isLoading: clustersLoading,
    refresh: refreshClusters,
  } = useClustersData(selectedWeek);

  const {
    data: clusterDetail,
    isLoading: detailLoading,
  } = useClusterDetail(selectedWeek, selectedClusterId);

  const handleCloseDetail = () => {
    setSelectedClusterId(null);
  };

  if (clustersError) {
    return (
      <div className="space-y-6">
        <FilterBar showP2PTier hidePeriod />
        <ErrorAlert
          title="Failed to load clusters"
          message={clustersError}
          onRetry={refreshClusters}
        />
      </div>
    );
  }

  const summary = clustersData?.summary;
  const clusters = clustersData?.clusters ?? [];

  return (
    <div className="space-y-6">
      <FilterBar showP2PTier hidePeriod />

      {/* Header with week selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Community Clusters
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Communities detected using Louvain algorithm
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-600 dark:text-zinc-400">
            Week:
          </label>
          <select
            value={selectedWeek}
            onChange={(e) => {
              setSelectedWeek(e.target.value);
              setSelectedClusterId(null);
            }}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
          >
            {availableWeeks.map((week) => (
              <option key={week} value={week}>
                {formatWeek(week)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard
          title="Total Clusters"
          value={summary?.totalClusters ?? 0}
          format="number"
        />
        <MetricCard
          title="Total Nodes"
          value={summary?.totalNodes ?? 0}
          format="compact"
        />
        <MetricCard
          title="Avg Cluster Size"
          value={summary?.avgClusterSize ?? 0}
          format="number"
        />
        <MetricCard
          title="Largest Cluster"
          value={summary?.largestClusterSize ?? 0}
          format="number"
        />
      </div>

      {/* Main content: list + detail panel */}
      <div className="flex gap-6">
        {/* Clusters list */}
        <div
          className={`rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 ${
            selectedClusterId ? "w-3/5" : "w-full"
          } transition-all`}
        >
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Clusters ({clusters.length})
            </h3>
          </div>
          <ClustersList
            clusters={clusters}
            selectedClusterId={selectedClusterId}
            onSelectCluster={setSelectedClusterId}
            isLoading={clustersLoading}
          />
        </div>

        {/* Detail panel */}
        {selectedClusterId && (
          <div className="w-2/5 rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            <ClusterDetailPanel
              data={clusterDetail}
              isLoading={detailLoading}
              onClose={handleCloseDetail}
            />
          </div>
        )}
      </div>
    </div>
  );
}
