"use client";

import { useState, useMemo } from "react";
import { FilterBar } from "@/components/filters/FilterBar";
import { ForceGraph } from "@/components/graph/ForceGraph";
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

export default function GraphPage() {
  const availableWeeks = useMemo(() => getAvailableWeeks(), []);
  const [selectedWeek, setSelectedWeek] = useState(availableWeeks[0]);

  return (
    <div className="space-y-6">
      <FilterBar showP2PTier hidePeriod />

      {/* Week selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            P2P Transfer Network
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Force-directed graph of wallet-to-wallet transfers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-600 dark:text-zinc-400">
            Week:
          </label>
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
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

      {/* Graph visualization */}
      <ForceGraph weekStart={selectedWeek} />
    </div>
  );
}
