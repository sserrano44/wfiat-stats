"use client";

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatNumber, formatDate } from "@/lib/utils/format";

interface AreaConfig {
  dataKey: string;
  name: string;
  color: string;
  fillOpacity?: number;
}

interface AreaChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  xKey: string;
  areas: AreaConfig[];
  height?: number;
  stacked?: boolean;
  formatY?: (value: number) => string;
}

export function AreaChart({
  data,
  xKey,
  areas,
  height = 300,
  stacked = false,
  formatY = formatNumber,
}: AreaChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-zinc-500">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart
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
          formatter={(value, name) => {
            const numValue = typeof value === "number" ? value : 0;
            return [formatY(numValue), name];
          }}
          labelFormatter={(label) => formatDate(String(label))}
          contentStyle={{
            backgroundColor: "var(--tooltip-bg, #fff)",
            border: "1px solid var(--tooltip-border, #e5e7eb)",
            borderRadius: "6px",
            fontSize: "12px",
            color: "#18181b",
          }}
          labelStyle={{ color: "#18181b", fontWeight: 600 }}
          itemStyle={{ color: "#3f3f46" }}
        />
        <Legend />
        {areas.map((area) => (
          <Area
            key={area.dataKey}
            type="monotone"
            dataKey={area.dataKey}
            name={area.name}
            stroke={area.color}
            fill={area.color}
            fillOpacity={area.fillOpacity ?? 0.3}
            stackId={stacked ? "stack" : undefined}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
