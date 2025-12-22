"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatNumber, formatDate } from "@/lib/utils/format";

interface BarConfig {
  dataKey: string;
  name: string;
  color: string;
}

interface BarChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  xKey: string;
  bars: BarConfig[];
  height?: number;
  stacked?: boolean;
  formatY?: (value: number) => string;
}

export function BarChart({
  data,
  xKey,
  bars,
  height = 300,
  stacked = false,
  formatY = formatNumber,
}: BarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-zinc-500">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          className="stroke-zinc-200 dark:stroke-zinc-700"
        />
        <XAxis
          dataKey={xKey}
          tickFormatter={(v) => formatDate(v)}
          tick={{ fontSize: 12 }}
          className="text-zinc-500"
        />
        <YAxis
          tickFormatter={formatY}
          tick={{ fontSize: 12 }}
          className="text-zinc-500"
          width={80}
        />
        <Tooltip
          formatter={(value) => {
            const numValue = typeof value === "number" ? value : 0;
            return [formatY(numValue), ""];
          }}
          labelFormatter={(label) => formatDate(String(label))}
          contentStyle={{
            backgroundColor: "var(--tooltip-bg, #fff)",
            border: "1px solid var(--tooltip-border, #e5e7eb)",
            borderRadius: "6px",
            fontSize: "12px",
          }}
        />
        <Legend />
        {bars.map((bar) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            name={bar.name}
            fill={bar.color}
            stackId={stacked ? "stack" : undefined}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
