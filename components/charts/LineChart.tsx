"use client";

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatNumber, formatDate } from "@/lib/utils/format";

interface LineConfig {
  dataKey: string;
  name: string;
  color: string;
  strokeDasharray?: string;
}

interface LineChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  xKey: string;
  lines: LineConfig[];
  height?: number;
  formatY?: (value: number) => string;
}

export function LineChart({
  data,
  xKey,
  lines,
  height = 300,
  formatY = formatNumber,
}: LineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-zinc-500">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart
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
        {lines.map((line) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name}
            stroke={line.color}
            strokeWidth={2}
            strokeDasharray={line.strokeDasharray}
            dot={false}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
