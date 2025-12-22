"use client";

import type { P2PTier } from "@/lib/types/filters";

interface P2PTierToggleProps {
  value: P2PTier;
  onChange: (value: P2PTier) => void;
}

const tierOptions: { value: P2PTier; label: string; description: string }[] = [
  { value: "all", label: "All", description: "All tiers" },
  { value: 1, label: "T1", description: "EOA to EOA" },
  { value: 2, label: "T2", description: "Includes smart wallets" },
];

export function P2PTierToggle({ value, onChange }: P2PTierToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
        P2P Tier
      </span>
      <div className="flex rounded-md border border-zinc-300 dark:border-zinc-600">
        {tierOptions.map((option) => (
          <button
            key={String(option.value)}
            onClick={() => onChange(option.value)}
            title={option.description}
            className={`px-3 py-1 text-sm font-medium transition-colors first:rounded-l-md last:rounded-r-md ${
              value === option.value
                ? "bg-blue-500 text-white"
                : "bg-white text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
