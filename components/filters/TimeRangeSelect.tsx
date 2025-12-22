"use client";

import type { TimeRange } from "@/lib/types/filters";

interface TimeRangeSelectProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}

const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "180d", label: "180 days" },
  { value: "365d", label: "1 year" },
];

export function TimeRangeSelect({ value, onChange }: TimeRangeSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="range-select"
        className="text-sm font-medium text-zinc-600 dark:text-zinc-400"
      >
        Period
      </label>
      <select
        id="range-select"
        value={value}
        onChange={(e) => onChange(e.target.value as TimeRange)}
        className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
      >
        {timeRangeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
