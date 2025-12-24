"use client";

import { useFilters } from "@/hooks/useFilters";
import { useFilterOptions } from "@/hooks/useDashboardData";
import { TokenSelect } from "./TokenSelect";
import { ChainSelect } from "./ChainSelect";
import { TimeRangeSelect } from "./TimeRangeSelect";
import { P2PTierToggle } from "./P2PTierToggle";

interface FilterBarProps {
  showP2PTier?: boolean;
  hidePeriod?: boolean;
}

export function FilterBar({ showP2PTier = false, hidePeriod = false }: FilterBarProps) {
  const { filters, setFilter } = useFilters();
  const { tokens, chains, isLoading } = useFilterOptions();

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
      <TokenSelect
        value={filters.token}
        onChange={(value) => setFilter("token", value)}
        tokens={tokens}
        isLoading={isLoading}
      />
      <ChainSelect
        value={filters.chain}
        onChange={(value) => setFilter("chain", value)}
        chains={chains}
        isLoading={isLoading}
      />
      {!hidePeriod && (
        <TimeRangeSelect
          value={filters.range}
          onChange={(value) => setFilter("range", value)}
        />
      )}
      {showP2PTier && (
        <P2PTierToggle
          value={filters.p2pTier}
          onChange={(value) => setFilter("p2pTier", value)}
        />
      )}
    </div>
  );
}
