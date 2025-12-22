"use client";

import useSWR from "swr";
import type { FreshnessResponse, ApiError } from "@/lib/types/api";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

const fetcher = async (url: string): Promise<FreshnessResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = (await res.json()) as ApiError;
    throw new Error(error.message || error.error);
  }
  return res.json();
};

function formatAge(minutes: number): string {
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getAgeColor(minutes: number): string {
  if (minutes < 10) return "text-green-600 dark:text-green-400";
  if (minutes < 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export function FreshnessPanel() {
  const { data, error, isLoading, mutate } = useSWR<FreshnessResponse>(
    "/api/freshness",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorAlert
        title="Could not load sync status"
        message={error.message}
        onRetry={() => mutate()}
      />
    );
  }

  // Group by token
  const byToken = data?.items.reduce((acc, item) => {
    if (!acc[item.tokenSymbol]) acc[item.tokenSymbol] = [];
    acc[item.tokenSymbol].push(item);
    return acc;
  }, {} as Record<string, typeof data.items>) || {};

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Last checked: {data?.generatedAt ? new Date(data.generatedAt).toLocaleTimeString() : "-"}
        </p>
        <button
          onClick={() => mutate()}
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(byToken).map(([token, items]) => (
          <div
            key={token}
            className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <h4 className="mb-3 font-semibold text-zinc-900 dark:text-white">{token}</h4>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.chainName} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-zinc-600 dark:text-zinc-400">
                    {item.chainName}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-zinc-500">
                      #{item.lastBlock.toLocaleString()}
                    </span>
                    <span className={getAgeColor(item.ageMinutes)}>
                      {formatAge(item.ageMinutes)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
