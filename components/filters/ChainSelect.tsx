"use client";

import type { ChainName } from "@/lib/types/filters";

interface ChainSelectProps {
  value: ChainName;
  onChange: (value: ChainName) => void;
  chains: Array<{ id: number; name: string; evmChainId: number }>;
  isLoading: boolean;
}

const chainDisplayNames: Record<string, string> = {
  ethereum: "Ethereum",
  base: "Base",
  worldchain: "Worldchain",
};

export function ChainSelect({
  value,
  onChange,
  chains,
  isLoading,
}: ChainSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="chain-select"
        className="text-sm font-medium text-zinc-600 dark:text-zinc-400"
      >
        Chain
      </label>
      <select
        id="chain-select"
        value={value}
        onChange={(e) => onChange(e.target.value as ChainName)}
        disabled={isLoading}
        className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
      >
        <option value="all">All Chains</option>
        {chains.map((chain) => (
          <option key={chain.id} value={chain.name}>
            {chainDisplayNames[chain.name] || chain.name}
          </option>
        ))}
      </select>
    </div>
  );
}
