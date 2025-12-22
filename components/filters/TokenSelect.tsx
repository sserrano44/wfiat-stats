"use client";

import type { TokenSymbol } from "@/lib/types/filters";

interface TokenSelectProps {
  value: TokenSymbol;
  onChange: (value: TokenSymbol) => void;
  tokens: Array<{ id: number; symbol: string; name: string }>;
  isLoading: boolean;
}

export function TokenSelect({
  value,
  onChange,
  tokens,
  isLoading,
}: TokenSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="token-select"
        className="text-sm font-medium text-zinc-600 dark:text-zinc-400"
      >
        Token
      </label>
      <select
        id="token-select"
        value={value}
        onChange={(e) => onChange(e.target.value as TokenSymbol)}
        disabled={isLoading}
        className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
      >
        <option value="all">All Tokens</option>
        {tokens.map((token) => (
          <option key={token.id} value={token.symbol}>
            {token.symbol}
          </option>
        ))}
      </select>
    </div>
  );
}
