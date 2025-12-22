import { formatNumber, formatCompact } from "@/lib/utils/format";

interface MetricCardProps {
  title: string;
  value: number;
  subtitle?: string;
  format?: "number" | "compact" | "percent";
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function MetricCard({
  title,
  value,
  subtitle,
  format = "compact",
  trend,
}: MetricCardProps) {
  const formattedValue =
    format === "percent"
      ? `${(value * 100).toFixed(1)}%`
      : format === "compact"
        ? formatCompact(value)
        : formatNumber(value);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {title}
      </p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-2xl font-semibold text-zinc-900 dark:text-white">
          {formattedValue}
        </p>
        {trend && (
          <span
            className={`text-sm font-medium ${
              trend.isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend.isPositive ? "+" : ""}
            {trend.value.toFixed(1)}%
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}
